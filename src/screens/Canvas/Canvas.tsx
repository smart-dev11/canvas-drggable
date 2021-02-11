import React, { useContext, useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useHistory, useLocation } from 'react-router-dom'
import { useObservable } from 'rxjs-hooks'
import { docData } from 'rxfire/firestore'
import { FileDrop } from 'react-file-drop'
import { Stage, Layer } from 'react-konva'

import { FirestoreContext, ICanvas } from '../../firebase'
import { usePreviews, useSetPreviewsData } from '../../hooks/previews'
import { useContainers, useSetContainersData } from '../../hooks/containers'
import { useWebsocketSetup } from '../../hooks/webSocket'

import {
  createOnStageScroll,
  createOnStageMouseMove,
  createOnStageMouseDown,
  createOnStageMouseUp,
  updateUrlLocation,
  useAddKeyboardListener,
} from '../../logic/canvasInteraction'
import { createOnFileDrop } from '../../logic/fileUpload'
import {
  createInitContainersPreviewDrag,
  createCompleteContainerPreviewsDrag,
  nullDragContainerPreviews,
} from '../../logic/containers'
import {
  createDeleteSelected,
  createPasteSelected,
  isInstanceSelected,
  createUpdateSelectedObjects,
  useSelectedArea,
} from '../../logic/selection'
import { clamp } from '../../logic/util'
import { previewScale, isVideo, isNote } from '../../logic/previews'

import { IPreview, ContainerIPreviews, IPreviewInstance } from '../../types/previews'
import { IContainer, IContainerInstance } from '../../types/containers'
import { MossMediaSelectionTuple, AreaCoords } from '../../types/moss'
import { KonvaElement, KonvaMouseEvt } from '../../types/konva'
import { ZOOM_MIN, ZOOM_MAX } from '../../constants/position'
import { EMPTY_OBJ } from '../../constants/empty'

import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import WSC from '../../WebSocketClient'

import './Canvas.scss'

import { Menu, Avatars, Tools, Add } from '../../ui/organisms'

import { Container } from './Container'
import { URLImage } from './URLImage'
import { Video } from './Video'
import Note from './Note'
import SelectionTransformer from './SelectionTransformer'


function Canvas(props: any) {
  // @TODO Some of the top things here might not need to be state
  // changing them to refs would save us re-renders

  // START - MAIN DEFS - START
  const firestore = useContext(FirestoreContext)
  let { canvasId } = useParams<{ canvasId: string }>()
  const history = useHistory()
  const { search, pathname } = useLocation()

  const canvas = useObservable(() => docData<ICanvas>(firestore.doc(`canvases/${canvasId}`)))
  const previews = usePreviews(canvasId)
  const containers = useContainers(canvasId)
  const stageRef = useRef<any>(null)
  const portalTargetRef = useRef<HTMLDivElement>(null)
  // END - MAIN DEFS - END

  // ------------------------------
  // START - CANVAS STATE - START
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [clickMode, setClickMode] = useState<string>('default')
  const isResizingRef = useRef<boolean>(false)
  const [scrollingLocked, setScrollingLocked] = useState<boolean>(false)
  // Setting the cursor on hover of canvas element is done via
  // the Stage component, see https://konvajs.org/docs/styling/Mouse_Cursor.html
  const setCursor = (cursorType: string) => {
    if (stageRef.current) {
      stageRef.current.container().style.cursor = cursorType
    }
  }

  // allow access to selectedObjects from within even handlers
  // sorcery thanks to https://medium.com/geographit/accessing-react-state-in-event-listeners-with-usestate-and-useref-hooks-8cceee73c559
  const [selectedObjects, _setSelectedObjects] = useState<MossMediaSelectionTuple[]>([])
  const selectedObjectsRef = useRef(selectedObjects)
  const setSelectedObjects = (data: MossMediaSelectionTuple[]) => {
    selectedObjectsRef.current = data
    _setSelectedObjects(data)
  }
  // END - CANVAS STATE - END

  // --------------------------------------
  // START - CONTROLS / INTERACTION - START
  const [isHoldingSpacebar, setIsHoldingSpacebar] = useState<boolean>(false)
  useEffect(() => {
    isHoldingSpacebar ? setCursor('grab') : setCursor('default')
    return () => setCursor('default')
  }, [isHoldingSpacebar])

  // @TODO isMouseDown doesn't need to be state, no re-render required
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false)
  const [selectArea, setSelectArea] = useState<AreaCoords>(null)
  const clearSelectArea = () => {
    setSelectArea(null)
    setIsMouseDown(false)
  }
  const hasSelectArea = !!selectArea
  useEffect(() => {
    if (hasSelectArea) {
      window.addEventListener('mouseout', clearSelectArea)
    } else {
      window.removeEventListener('mouseout', clearSelectArea)
    }
  }, [hasSelectArea])
  const [zoom, setZoom] = useState<number>(1)
  useEffect(() => {
    if (stageRef.current && search) {
      const position = new URLSearchParams(search)
      const [urlX, urlY, urlZ] = position.get('p')?.split(',') || []
      if (urlX && urlY && urlZ) {
        const initialX = clamp(parseFloat(urlX), -50000, 50000)
        const initialY = clamp(parseFloat(urlY), -50000, 50000)
        const initialZoom = clamp(parseFloat(urlZ), ZOOM_MIN, ZOOM_MAX)
        stageRef.current.scale({ x: initialZoom, y: initialZoom })
        setZoom(initialZoom)
        stageRef.current.position({ x: initialX, y: initialY })
        if (initialX !== parseFloat(urlX) || initialY !== parseFloat(urlY) || initialZoom !== parseFloat(urlZ)) {
          updateUrlLocation(history, initialX, initialY, initialZoom)
        }
      } else {
        history.replace(pathname)
      }
    }
  }, [stageRef.current])

  const [stagePanStartCoordinates, setStagePanStartCoordinates] = useState<[number, number] | null>(null)
  const stagePositionStartPanCoordinatesRef = useRef<[number, number] | null>(null)
  useEffect(() => {
    if (stageRef.current && stagePositionStartPanCoordinatesRef) {
      if (stagePanStartCoordinates === null) {
        stagePositionStartPanCoordinatesRef.current = null
      } else {
        const { x, y } = stageRef.current.position()
        stagePositionStartPanCoordinatesRef.current = [x, y]
      }
    }
  }, [stagePanStartCoordinates])

  const [dragContainerPreviews, setDragContainerPreviews] = useState<any>(nullDragContainerPreviews)
  const [dragContainerPreviewsOffset, setDragContainerPreviewsOffset] = useState<[number, number] | null>(null)

  const selectedAreaCoordsRef = useRef<AreaCoords>(null)
  useSelectedArea({ selectedObjects, selectedAreaCoordsRef, previews, zoom })

  const onStageScroll = useCallback(createOnStageScroll(stageRef, setZoom, scrollingLocked, history), [scrollingLocked])
  const onStageMouseDown = useCallback(
    createOnStageMouseDown({
      setIsMouseDown,
      setStagePanStartCoordinates,
      isHoldingSpacebar,
      setCursor,
      zoom,
      stageRef,
      setSelectArea,
      selectedAreaCoordsRef,
      isResizingRef,
    }),
    [isHoldingSpacebar, zoom],
  )

  const onStageMouseMove = useCallback(
    createOnStageMouseMove({
      isHoldingSpacebar,
      stagePanStartCoordinates,
      stageRef,
      dragContainerPreviews,
      setDragContainerPreviewsOffset,
      stagePositionStartPanCoordinatesRef,
      zoom,
      isMouseDown,
    }),
    [
      dragContainerPreviews,
      isHoldingSpacebar,
      stagePanStartCoordinates,
      zoom,
      isMouseDown,
      !!selectedObjects.length,
      selectedObjects,
    ],
  )
  // END - CONTROLS / INTERACTION- END

  // ----------------------------
  // START - CANVAS DATA - START
  const localPreviewsDataRef = useRef<{ [key: string]: string }>(EMPTY_OBJ)
  const [activeContainerInstance, setActiveContainerInstance] = useState<[string, string] | null>()
  const [previewsData, setPreviewsData] = useState<{ [key: string]: IPreview }>({})
  const [containerPreviews, setContainerPreviews] = useState<ContainerIPreviews>({})
  const [containersData, setContainersData] = useState<{ [key: string]: IContainer }>({})
  useSetContainersData(containers, containerPreviews, setContainersData)
  useSetPreviewsData({ setPreviewsData, setContainerPreviews, previews, containerPreviews, localPreviewsDataRef, containersData })
  /*
    If you want to have media elements automatically select themselves
    upon instantiation, update the following ref with the instanceId
    of the thing you want to auto-select
  */
  const newMediaIdsRef = useRef<{ [key: string]: true }>({})
  const [draftNote, setDraftNote] = useState<{ x: number; y: number } | null>(null)
  const clearDraftNote = () => setDraftNote(null)
  // END - CANVAS DATA - END

  // --------------------------------
  // START - CANVAS SELECTION - START
  const updateActiveContainerInstance = (
    e: KonvaMouseEvt,
    container: IContainer,
    instance: IContainerInstance,
    element: KonvaElement,
  ) => {
    setActiveContainerInstance([container.containerId, instance.instanceId])
    setSelectedObjects([[container, instance, element]])
  }

  const deleteSelected = useCallback(
    createDeleteSelected({
      selectedObjectsRef,
      firestore,
      canvasId,
      setSelectedObjects,
      setActiveContainerInstance,
      setCursor,
    }),
    [firestore, canvasId],
  )

  const pasteSelected = useCallback(
    createPasteSelected({
      selectedObjectsRef,
      firestore,
      canvasId,
      setSelectedObjects,
      setActiveContainerInstance,
      newMediaIdsRef,
    }),
    [firestore, canvasId],
  )

  const updateSelectedObjects = useCallback(
    createUpdateSelectedObjects({ selectedObjects, setActiveContainerInstance, setSelectedObjects }),
    [selectedObjects],
  )

  const mediaAddToSelected = useCallback(
    (isHoldingSpacebar: boolean) => (e: KonvaMouseEvt, mediaTuple: MossMediaSelectionTuple, xOr?: boolean) => {
      if (isHoldingSpacebar) {
        return null
      }
      updateSelectedObjects(e.evt.shiftKey, [mediaTuple], xOr)
    },
    [updateSelectedObjects],
  )

  // END - CANVAS SELECTION - END

  // --------------------------
  // START - KEYBOARD EVENTS - START
  const stageRefHTMLElem = stageRef?.current?.container()

  useAddKeyboardListener({
    stageRefHTMLElem,
    setIsHoldingSpacebar,
    isMouseDown,
    deleteSelected,
    pasteSelected,
    onStageScroll,
  })
  // END - KEYBOARD EVENTS - END

  // ------------------------------
  // handle messages coming from the local backend server

  // these state vars all need to be ref based since they are used in event handlers
  const [_daemonId, _setDaemonId] = useState<string>('')
  const daemonIdRef = useRef(_daemonId)
  const setDaemonId = (data: any) => {
    daemonIdRef.current = data
    _setDaemonId(data)
  }
  const [_dropAttempted, _setDropAttempted] = useState<boolean>(false)
  const dropAttemptedRef = useRef(_dropAttempted)
  const setDropAttempted = (data: any) => {
    dropAttemptedRef.current = data
    _setDropAttempted(data)
  }
  const [_reconnectTimer, _setReconnectTimer] = useState<any>()
  const reconnectTimerRef = useRef(_reconnectTimer)
  const setReconnectTimer = (data: any) => {
    reconnectTimerRef.current = data
    _setReconnectTimer(data)
  }
  const [_connectedToServer, _setConnectedToServer] = useState<boolean>(false)
  const connectedToServerRef = useRef(_connectedToServer)
  const setConnectedToServer = (data: any) => {
    connectedToServerRef.current = data
    _setConnectedToServer(data)
  }

  useWebsocketSetup({
    setIsLoading,
    setDaemonId,
    setConnectedToServer,
    reconnectTimerRef,
    setReconnectTimer,
    dropAttemptedRef,
    setDropAttempted,
    canvasId,
    newMediaIdsRef,
  })

  // ------------------------------
  // START - DRAG AND DROP - START
  const onFileDrop = useCallback(
    createOnFileDrop({ canvasId, connectedToServerRef, setIsLoading, setDropAttempted, stageRef, zoom, localPreviewsDataRef }),
    [canvasId, zoom],
  )

  const initContainerPreviewsDrag = useCallback(
    createInitContainersPreviewDrag(stageRef, setDragContainerPreviews, zoom),
    [zoom],
  )

  const completeContainerPreviewsDrag = useCallback(
    createCompleteContainerPreviewsDrag({
      dragContainerPreviews,
      containers,
      stageRef,
      setDragContainerPreviews,
      zoom,
      canvasId,
      firestore,
      newMediaIdsRef,
    }),
    [dragContainerPreviews, containers, zoom, canvasId],
  )

  const onStageMouseUp = useCallback(
    createOnStageMouseUp({
      stagePanStartCoordinates,
      setStagePanStartCoordinates,
      isHoldingSpacebar,
      setCursor,
      dragContainerPreviews,
      completeContainerPreviewsDrag,
      setIsMouseDown,
      stageRef,
      updateSelectedObjects,
      previewsData,
      containersData,
      setActiveContainerInstance,
      selectedAreaCoordsRef,
      zoom,
      isResizingRef,
    }),
    [isHoldingSpacebar, completeContainerPreviewsDrag, stagePanStartCoordinates, previewsData, containersData, zoom],
  )
  // END - DRAG AND DROP - END

  // ----------------------------------------
  // open in finder / open in app
  const onOpenObject = (event: any, targetObject: any, inApp: boolean) => {
    if (!connectedToServerRef.current) {
      setDropAttempted(true)
      alert(
        "Sorry, you are not conected to Moss.. either you have not installed our desktop app, or it has crashed and can't restart.",
      )
      return
    }
    if (!targetObject) {
      return
    }
    let message
    if (targetObject.hasOwnProperty('assetId')) {
      message = {
        action: inApp ? 'open_in_app' : 'open_in_finder',
        data: {
          assetId: targetObject.assetId,
        },
      }
    } else if (targetObject.hasOwnProperty('directoryId')) {
      message = {
        action: 'open_in_finder',
        data: {
          directoryId: targetObject.directoryId,
        },
      }
    } else {
      alert('Sorry, an error occurred trying to figure out what to open')
      return
    }

    //send off the list of files to the backend for instantiation
    WSC.send(JSON.stringify(message))
  }

  // --------------------------
  // variables to scale text
  const fontSize = 11 / zoom
  const iconOuterWidth = 22 / zoom
  const iconPadding = 5 / zoom
  const iconWidth = 12 / zoom
  const paddingTop = 8 / zoom
  const minTextWidth = 80

  console.log('previewsData', previewsData);
  return (
    <div>
      <div ref={portalTargetRef} />
      <Menu classList={isLoading ? ['syncing'] : []} shortCode={canvas ? canvas.shortCode : 'Loading...'} />
      <Avatars />
      <Tools setCursor={setCursor} clickMode={clickMode} setClickMode={setClickMode} />
      <Add />
      <FileDrop onDrop={onFileDrop}>
        <ToastContainer
          position="top-center"
          autoClose={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          draggable
        />
        <Stage
          width={window.innerWidth}
          height={window.innerHeight}
          ref={stageRef}
          onWheel={onStageScroll}
          onClick={(e: KonvaMouseEvt) => {
            if (clickMode === 'note') {
              setClickMode('default')
              setDraftNote({ x: e.evt.clientX, y: e.evt.clientY })
              setCursor('default')
            }
          }}
          onMouseDown={onStageMouseDown}
          onMouseMove={onStageMouseMove}
          onMouseUp={onStageMouseUp}
          id="stage"
        >
          <Layer>
            <SelectionTransformer
              selectedObjects={selectedObjects}
              previews={previewsData}
              canvasId={canvasId}
              selectedAreaCoordsRef={selectedAreaCoordsRef}
            >
              {Object.keys(previewsData).map((key: string) => {
                const preview = previewsData[key]
                return preview?.instances?.map((instance: IPreviewInstance, idx: number) => {
                  if (isVideo(preview)) {
                    return (
                      <Video
                        canvasId={canvasId}
                        preview={preview}
                        instance={instance}
                        isLinked={preview.linked}
                        readOnly={preview.daemonId !== daemonIdRef.current}
                        X={instance.X}
                        Y={instance.Y}
                        scale={instance.scale}
                        width={preview.dimensions[0]}
                        height={preview.dimensions[1]}
                        name={preview.previewName}
                        src={preview.url}
                        previewSrc={preview.uploadPreviewUrl}
                        updatedAt={preview.updatedAt}
                        key={instance.instanceId}
                        inContainer={false}
                        mediaAddToSelected={mediaAddToSelected(isHoldingSpacebar)}
                        selected={isInstanceSelected([preview, instance], selectedObjects)}
                        draggable={!isHoldingSpacebar}
                        fontSize={fontSize}
                        iconOuterWidth={iconOuterWidth}
                        iconPadding={iconPadding}
                        iconWidth={iconWidth}
                        paddingTop={paddingTop}
                        minTextWidth={80}
                        zoom={zoom}
                        onOpenObject={onOpenObject}
                        newMediaIdsRef={newMediaIdsRef}
                        isMultiSelect={selectedObjects.length > 1}
                      />
                    )
                  } else if (isNote(preview)) {
                    return (
                      <Note
                        x={instance.X}
                        y={instance.Y}
                        setCursor={setCursor}
                        portalTargetRef={portalTargetRef}
                        canvasId={canvasId}
                        key={instance.instanceId}
                        instance={instance}
                        preview={preview}
                        selected={isInstanceSelected([preview, instance], selectedObjects)}
                        mediaAddToSelected={mediaAddToSelected(isHoldingSpacebar)}
                        zoom={zoom}
                        stagePosition={stageRef.current.position()}
                        setScrollingLocked={setScrollingLocked}
                        isHoldingSpacebar={isHoldingSpacebar}
                        newMediaIdsRef={newMediaIdsRef}
                        selectedObjectCount={selectedObjects.length}
                        isMultiSelect={selectedObjects.length > 1}
                      />
                    )
                  } else {
                    return (
                      <URLImage
                        canvasId={canvasId}
                        preview={preview}
                        instance={instance}
                        isLinked={preview.linked}
                        readOnly={preview.daemonId !== daemonIdRef.current}
                        X={instance.X}
                        Y={instance.Y}
                        scale={instance.scale}
                        width={preview.dimensions[0]}
                        height={preview.dimensions[1]}
                        name={preview.previewName}
                        src={preview.url}
                        previewSrc={preview.uploadPreviewUrl}
                        updatedAt={preview.updatedAt}
                        key={instance.instanceId}
                        inContainer={false}
                        mediaAddToSelected={mediaAddToSelected(isHoldingSpacebar)}
                        selected={isInstanceSelected([preview, instance], selectedObjects)}
                        draggable={!isHoldingSpacebar}
                        fontSize={fontSize}
                        iconOuterWidth={iconOuterWidth}
                        iconPadding={iconPadding}
                        iconWidth={iconWidth}
                        paddingTop={paddingTop}
                        minTextWidth={80}
                        zoom={zoom}
                        onOpenObject={onOpenObject}
                        newMediaIdsRef={newMediaIdsRef}
                        isMultiSelect={selectedObjects.length > 1}
                      />
                    )
                  }
                })
              })}

              {draftNote && (
                <Note
                  x={draftNote.x}
                  y={draftNote.y}
                  clearDraftNote={clearDraftNote}
                  setCursor={setCursor}
                  portalTargetRef={portalTargetRef}
                  canvasId={canvasId}
                  preview={null}
                  instance={null}
                  startWithEditOpen
                  zoom={zoom}
                  stagePosition={stageRef.current.position()}
                  setScrollingLocked={setScrollingLocked}
                  isHoldingSpacebar={isHoldingSpacebar}
                />
              )}
              {containersData &&
                Object.keys(containersData).map((key: string) => {
                  const container = containersData[key]
                  return container?.instances?.map((instance: IContainerInstance, idx: number) => (
                    <Container
                      daemonId={daemonIdRef.current}
                      canvasId={canvasId}
                      container={container}
                      instance={instance}
                      linked={container.linked}
                      readOnly={container.daemonId !== daemonIdRef.current}
                      X={instance.X}
                      Y={instance.Y}
                      key={instance.instanceId}
                      containerInstanceId={instance.instanceId}
                      mediaAddToSelected={mediaAddToSelected(isHoldingSpacebar)}
                      selected={isInstanceSelected([container, instance], selectedObjects)}
                      onPreviewClick={updateActiveContainerInstance}
                      activeContainerInstance={activeContainerInstance}
                      initContainerPreviewsDrag={initContainerPreviewsDrag}
                      fontSize={fontSize}
                      iconOuterWidth={iconOuterWidth}
                      iconPadding={iconPadding}
                      iconWidth={iconWidth}
                      paddingTop={paddingTop}
                      minTextWidth={minTextWidth}
                      zoom={stageRef?.current?.scaleX()}
                      onOpenObject={onOpenObject}
                      isHoldingSpacebar={isHoldingSpacebar}
                      newMediaIdsRef={newMediaIdsRef}
                    />
                  ))
                })}
              {/* @TODO Are there more drag container preview types besides images? */}
              {dragContainerPreviews?.previews?.map((preview: IPreview, idx: number) => {
                const { containerX, containerY } = preview
                if (!dragContainerPreviewsOffset || !(containerX && containerY)) return null
                const x = containerX + dragContainerPreviewsOffset[0]
                const y = containerY + dragContainerPreviewsOffset[1]
                const height = preview.dimensions[1]
                const width = preview.dimensions[0]
                if (!(x && y && height && width)) return null
                return (
                  <URLImage
                    canvasId={canvasId}
                    // @TODO These props might not be necessary
                    iconOuterWidth={iconOuterWidth}
                    iconWidth={iconWidth}
                    paddingTop={paddingTop}
                    minTextWidth={minTextWidth}
                    iconPadding={iconPadding}
                    fontSize={fontSize}
                    // End @TODO

                    preview={preview}
                    instance={null}
                    X={x}
                    Y={y}
                    width={width}
                    height={height}
                    name={preview.previewName}
                    key={idx}
                    scale={previewScale(preview)}
                    src={preview.url}
                    updatedAt={preview.updatedAt}
                    selected={true}
                  />
                )
              })}
            </SelectionTransformer>
          </Layer>
        </Stage>
      </FileDrop>
    </div>
  )
}

export default Canvas
