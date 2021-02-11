import { useEffect, useCallback } from 'react'
import throttle from 'lodash.throttle'
import debounce from 'lodash.debounce'
import { History } from 'history'
import { KonvaMouseEvt, KonvaElement } from '../types/konva'
import { IContainer } from '../types/containers'
import { IPreview, DragContainerPreviews } from '../types/previews'
import { MossMediaSelectionTuple, AreaCoords } from '../types/moss'
import { ZOOM_MIN, ZOOM_MAX } from '../constants/position'
import { clamp, roundToDecimal } from './util'

// START - UTILS - START
export const getZoomedAndScrolledPosition = (
  eventCoords: [number, number],
  canvasShiftCoords: [number, number],
  zoom: number,
) => eventCoords.map((eCoord, i) => Math.round((eCoord - canvasShiftCoords[i]) / zoom))

export const isWithinSelectedArea = (position: [number, number], selectedAreaRef: React.RefObject<AreaCoords>) => {
  if (!selectedAreaRef.current) return false
  const [x, y] = position
  const [tlX, tlY, brX, brY] = selectedAreaRef.current
  if (x >= tlX && x <= brX && y >= tlY && y <= brY) {
    return true
  }
  return false
}

export const updateUrlLocation = debounce((history: History, x, y, scale: number) => {
  const {
    location: { pathname },
    replace,
  } = history
  const lastChar = pathname[pathname.length - 1]

  replace(`${pathname}${lastChar === '/' ? '' : '/'}?p=${roundToDecimal(x, 2)},${roundToDecimal(y, 2)},${scale}`)
}, 100)
// END - UTILS - END

// START - SCROLL, ZOOM, WHEEL - START
// A lower throttle count decreases performance but increases smoothness
const wheelThrottle = 15 //ms, 16ms is ~once/frame at 60fps
const zoomFriction = 110

const scrollOrZoom = throttle(
  (
    stageRef: React.RefObject<KonvaElement>,
    setZoom: (zoom: number) => void,
    scrollingLocked: boolean,
    history: History,
    e: any,
  ) => {
    if (!scrollingLocked) {
      requestAnimationFrame(() => {
        const oldScale = stageRef?.current?.scaleX()
        if (e.evt.ctrlKey) {
          // Zooming
          const pointer = stageRef?.current?.getPointerPosition()
          const [mouseX, mouseY] = getZoomedAndScrolledPosition(
            [pointer.x, pointer.y],
            [stageRef?.current?.x(), stageRef?.current?.y()],
            oldScale,
          )
          const mousePointTo = {
            x: mouseX,
            y: mouseY,
          }

          const dynamicScale = 1 + Math.abs(e.evt.deltaY) / zoomFriction
          let newScale = e.evt.deltaY <= 0 ? oldScale * dynamicScale : oldScale / dynamicScale
          // Round to 2 decimal places, limit to between zoom min and max
          newScale = clamp(roundToDecimal(newScale, 2), ZOOM_MIN, ZOOM_MAX)

          if (oldScale !== newScale || e.overrides?.zoom) {
            const appliedZoom = e.overrides?.zoom || newScale
            stageRef?.current?.scale({ x: appliedZoom, y: appliedZoom })

            const newPos = {
              x: pointer.x - mousePointTo.x * appliedZoom,
              y: pointer.y - mousePointTo.y * appliedZoom,
            }
            stageRef?.current?.position(newPos)
            stageRef?.current?.batchDraw()
            setZoom(appliedZoom)
            updateUrlLocation(history, newPos.x, newPos.y, appliedZoom)
          }
        } else {
          // Panning
          const newPos = {
            x: stageRef?.current?.x() + e.evt.wheelDeltaX,
            y: stageRef?.current?.y() + e.evt.wheelDeltaY,
          }
          stageRef?.current?.position(newPos)
          stageRef?.current?.batchDraw()
          updateUrlLocation(history, newPos.x, newPos.y, oldScale)
        }
      })
    }
  },
  wheelThrottle,
)

export const createOnStageScroll = (
  stageRef: React.RefObject<KonvaElement>,
  setZoom: (zoom: number) => void,
  scrollingLocked: boolean,
  history: History,
) => (e: any) => {
  /*
    scrollOrZoom is throttled so that the complex canvas positioning and resizing logic
    isn't run on every ms of scrolling/zooming

    However, if we don't prevent the scroll or zoom event default on every event fire
    we end up with the browser handling scroll or zoom events inbetween our throttled
    handling, which leads to some seriously janky scrolling/zooming behavior
  */
  e.evt.preventDefault()
  scrollOrZoom(stageRef, setZoom, scrollingLocked, history, e)
}
// END - SCROLL, WHEEL, ZOOM - END

// START - MOUSE & CLICK - START
export const createOnStageMouseDown = ({
  setIsMouseDown,
  setStagePanStartCoordinates,
  isHoldingSpacebar,
  setCursor,
  stageRef,
  setSelectArea,
  zoom,
  selectedAreaCoordsRef,
  isResizingRef,
}: {
  setIsMouseDown: (isDown: boolean) => void
  setStagePanStartCoordinates: (coords: [number, number]) => void
  isHoldingSpacebar: boolean
  setCursor: (cursor: string) => void
  stageRef: React.RefObject<KonvaElement> // Konva Stage
  setSelectArea: (coords: AreaCoords) => void
  zoom: number
  selectedAreaCoordsRef: React.RefObject<AreaCoords>
  isResizingRef: React.MutableRefObject<boolean>
}) => (e: KonvaMouseEvt) => {
  const { x, y } = e.evt
  setIsMouseDown(true)
  if (isHoldingSpacebar) {
    setStagePanStartCoordinates([x, y])
    setCursor('grabbing')
  } else if (e.target.attrs.id === 'stage') {
    const { x: offsetX, y: offsetY } = stageRef.current.position()
    const [relativeX, relativeY] = getZoomedAndScrolledPosition([x, y], [offsetX, offsetY], zoom)
    if (!isWithinSelectedArea([relativeX, relativeY], selectedAreaCoordsRef)) {
      setSelectArea([relativeX, relativeY, 0, 0])
    }
  } else if (e.target.attrs.name?.includes('_anchor')) {
    isResizingRef.current = true
  }
}

const emptySelected: [] = []
export const createOnStageMouseUp = ({
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
}: {
  stagePanStartCoordinates: [number, number] | null
  setStagePanStartCoordinates: (coords: null) => void
  isHoldingSpacebar: boolean
  setCursor: (cursor: string) => void
  dragContainerPreviews: DragContainerPreviews
  completeContainerPreviewsDrag: (e: KonvaMouseEvt) => void
  setIsMouseDown: (isDown: false) => void
  stageRef: React.RefObject<KonvaElement>
  updateSelectedObjects: (shouldCombine: boolean, incomingMediaTuple: MossMediaSelectionTuple[]) => void
  previewsData: { [key: string]: IPreview }
  containersData: { [key: string]: IContainer }
  setActiveContainerInstance: (instance: null) => void
  selectedAreaCoordsRef: React.RefObject<AreaCoords>
  zoom: number
  isResizingRef: React.MutableRefObject<boolean>
}) => (e: KonvaMouseEvt) => {
  setIsMouseDown(false)
  // clear panning coordinates
  if (stagePanStartCoordinates) setStagePanStartCoordinates(null)

  // reset cursor
  isHoldingSpacebar ? setCursor('grab') : setCursor('default')

  // finish container preview dragging
  if (dragContainerPreviews.previews.length) {
    completeContainerPreviewsDrag(e)
    updateSelectedObjects(false, emptySelected)
  }

  const targetId = e.target.attrs.id
  // If clicking on the stage and not currently resizing an element...
  if ((targetId === 'stage' || targetId === 'selectionArea') && !isResizingRef.current) {
    // ...clear selected objects
    updateSelectedObjects(false, emptySelected)
    setActiveContainerInstance(null)
  }
  isResizingRef.current = false
}

export const createOnStageMouseMove = ({
  isHoldingSpacebar,
  stagePanStartCoordinates,
  stageRef,
  dragContainerPreviews,
  setDragContainerPreviewsOffset,
  stagePositionStartPanCoordinatesRef,
  zoom,
  isMouseDown,
}: {
  isHoldingSpacebar: boolean
  stagePanStartCoordinates: [number, number] | null
  stageRef: React.RefObject<KonvaElement>
  dragContainerPreviews: any
  setDragContainerPreviewsOffset: (coords: [number, number] | null) => void
  stagePositionStartPanCoordinatesRef: React.RefObject<[number, number]>
  zoom: number
  isMouseDown: boolean
}) => (e: KonvaMouseEvt) => {
  const isDraggingStage = isHoldingSpacebar && stagePanStartCoordinates && stagePositionStartPanCoordinatesRef.current
  const isDraggingContainerPreview = dragContainerPreviews.previews.length

  if (isDraggingContainerPreview || isDraggingStage) {
    // Get the abs evt position & current stage position, calculate relative evt position
    const { x, y }: { x: number; y: number } = e.evt
    const { x: stageOffsetX, y: stageOffsetY } = stageRef.current.position()
    const [relativeEX, relativeEY] = getZoomedAndScrolledPosition([x, y], [stageOffsetX, stageOffsetY], zoom)

    if (isDraggingStage) {
      // If moving the stage get the initial stage pan & pan event coordinates...
      const [stageInitX, stageInitY] = stagePositionStartPanCoordinatesRef.current
      const [initX, initY] = stagePanStartCoordinates
      // ...and use those to create a new x and y position for the canvas
      const newX = Math.round(stageInitX - (initX - x))
      const newY = Math.round(stageInitY - (initY - y))

      stageRef?.current?.position({ x: newX, y: newY })
      stageRef?.current?.batchDraw()
    } else if (isDraggingContainerPreview) {
      // If dragging a container preview calculate the proper offset coord position
      // then set those coords as the new preview coords
      const offsetX = dragContainerPreviews.instanceX + relativeEX - dragContainerPreviews.startX
      const offsetY = dragContainerPreviews.instanceY + relativeEY - dragContainerPreviews.startY

      setDragContainerPreviewsOffset([offsetX, offsetY])
    }
  }
}
// END - MOUSE & CLICK - END

// START - KEYBOARD - START
export const useAddKeyboardListener = ({
  stageRefHTMLElem,
  setIsHoldingSpacebar,
  isMouseDown,
  deleteSelected,
  pasteSelected,
  onStageScroll,
}: {
  stageRefHTMLElem: HTMLElement
  setIsHoldingSpacebar: (isHoldingSpacebar: boolean) => void
  isMouseDown: boolean
  deleteSelected: () => void
  pasteSelected: () => void
  onStageScroll: (e: any) => void
}) => {
  const handleKeyDown = useCallback(
    createHandleKeyDown({
      setIsHoldingSpacebar,
      stageRefHTMLElem,
      isMouseDown,
      deleteSelected,
      pasteSelected,
      onStageScroll,
    }),
    [isMouseDown, pasteSelected, deleteSelected, onStageScroll, stageRefHTMLElem],
  )
  const handleKeyUp = useCallback(createHandleKeyUp(setIsHoldingSpacebar, stageRefHTMLElem), [stageRefHTMLElem])

  useEffect(() => {
    if (stageRefHTMLElem) {
      stageRefHTMLElem.tabIndex = 1
      stageRefHTMLElem.focus()
      stageRefHTMLElem?.addEventListener('keydown', handleKeyDown)
      stageRefHTMLElem?.addEventListener('keyup', handleKeyUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageRefHTMLElem])
}

const createHandleKeyDown = ({
  setIsHoldingSpacebar,
  stageRefHTMLElem,
  isMouseDown,
  deleteSelected,
  pasteSelected,
  onStageScroll,
}: {
  stageRefHTMLElem: HTMLElement
  setIsHoldingSpacebar: (isHoldingSpacebar: boolean) => void
  isMouseDown: boolean
  deleteSelected: () => void
  pasteSelected: () => void
  onStageScroll: (e: any) => void
}) => (e: KeyboardEvent) => {
  if (e.repeat) return
  switch (e.code.toLowerCase()) {
    case 'space':
      setIsHoldingSpacebar(true)
      stageRefHTMLElem.classList.remove('cursor--default')
      if (isMouseDown) {
        stageRefHTMLElem.classList.remove('cursor--grab')
        stageRefHTMLElem.classList.add('cursor--grabbing')
      } else {
        stageRefHTMLElem.classList.remove('cursor--grabbing')
        stageRefHTMLElem.classList.add('cursor--grab')
      }
      break
    case 'backspace':
    case 'delete':
      deleteSelected()
      break
    case 'keyv':
      pasteSelected()
      break
    case 'digit0':
      onStageScroll({
        evt: {
          ctrlKey: true,
          preventDefault: () => {},
        },
        overrides: {
          zoom: 1,
        },
      })
      break
    // Don't assign anything to 'c'
    // Many users will try to use c to copy before pasting
    // Which, while unnecessary, is a common enough pattern that
    // we don't want to interrupt it
    case 'keyc':
    default:
      break
  }
}

const createHandleKeyUp = (
  setIsHoldingSpacebar: (isHoldingSpacebar: boolean) => void,
  stageRefHTMLElem: HTMLElement,
) => (e: KeyboardEvent) => {
  if (e.repeat) return
  if (e.code.toLowerCase() === 'space') {
    setIsHoldingSpacebar(false)
    stageRefHTMLElem.classList.remove('cursor--grab')
    stageRefHTMLElem.classList.remove('cursor--grabbing')
    stageRefHTMLElem.classList.add('cursor--default')
  }
}
// END - KEYBOARD - END
