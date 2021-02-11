import React, { useContext, useRef, useState, Fragment, SyntheticEvent, useEffect, useCallback, memo } from 'react'
import { Text, Rect, Group, Image } from 'react-konva'

import { FirestoreContext } from '../../firebase'
import { createPreviewInstance, updatePreviewInstance, deletePreviewInstance } from '../../logic/firebase'
import { getZoomedAndScrolledPosition } from '../../logic/canvasInteraction'
import { IPreview, IPreviewInstance } from '../../types/previews'
import { KonvaElement, KonvaMouseEvt } from '../../types/konva'
import { MossMediaSelectionTuple } from '../../types/moss'
import { NOTE_MIME_TYPE } from '../../constants/mimeTypes'
import { black, darkGray3, darkGray2, lightGray3, lightGray2, lightGray1, white } from '../../constants/colors'

import { fadeFill, fadeInOpacity, fadeOutOpacity } from '../../logic/animations'

import Portal from './Portal'
import Draggable from './Draggable'

import './Note.scss'

import useImage from 'use-image'
import noteH1 from '../../assets/icons/note-h1.png'
import noteH2 from '../../assets/icons/note-h2.png'
import noteH3 from '../../assets/icons/note-h3.png'

const fontSizes = ['H1', 'H2', 'H3']
const getFontProps = (fontSize: string | undefined) => {
  let editorWidth: number
  let src: string
  let iFontSize: number
  let iLineHeight: number
  let iFontFamily: string
  let textMaxWidth: number
  let descender: number
  switch (fontSize) {
    case 'H1':
      editorWidth = 500
      src = noteH1
      iFontSize = 46
      iLineHeight = 48
      iFontFamily = 'Lab Grotesque Bold'
      textMaxWidth = 500
      descender = 12.5
      break
    case 'H3':
      editorWidth = 300
      src = noteH3
      iFontSize = 14
      iLineHeight = 18
      iFontFamily = 'Lab Grotesque Light'
      textMaxWidth = 300
      descender = 5.5
      break
    default:
      // H2
      editorWidth = 400
      src = noteH2
      iFontSize = 22
      iLineHeight = 26
      iFontFamily = 'Lab Grotesque Light'
      textMaxWidth = 400
      descender = 7.5
      break
  }
  return {
    editorWidth,
    src,
    iFontSize,
    iLineHeight,
    iFontFamily,
    textMaxWidth,
    descender,
  }
}
// START - NOTE SIZE PICKER - START
// @TODO This NoteSize component can probably be combined with the
// note size jsx in the NoteEditor component
interface NoteSizeProps {
  index: number
  zoom: number
  canvasId: string
  instance?: IPreviewInstance | null
  preview?: IPreview | null
  f: string
}

const NoteSize: React.FC<NoteSizeProps> = ({ index, zoom, instance, preview, canvasId, f, }) => {
  const [iconH1] = useImage(noteH1)
  const [iconH2] = useImage(noteH2)
  const [iconH3] = useImage(noteH3)
  const [isIconHovered, setIsIconHovered] = useState<boolean>(false)
  const firestore = useContext(FirestoreContext)
  const initializedRef = useRef<boolean>(false)
  const iconRef = useRef<KonvaElement>(null)

  const resizeNote = (fontSize: string) => {
    const iId = instance?.instanceId
    const pId = preview?.previewId
    if (iId && pId) {
      updatePreviewInstance(firestore, canvasId, pId, iId, {
        ...instance,
        fontSize,
      })
    }
  }

  const fadeIn = () =>
    iconRef.current.to({
      duration: 0.095,
      fill: lightGray1,
    })

  // @TODO At some point, combine all UseEffects under one master Media component
  useEffect(() => {
    if (instance?.fontSize !== f) {
      if (isIconHovered) {
        fadeIn()
      } else {
        if (initializedRef.current) {
          fadeFill(iconRef.current, white)
        }
        initializedRef.current = true
      }
    }
  }, [isIconHovered])

  // prevent size from displaying incorrectly when switching sizes quickly
  // can't stop konva tween, so wait for it to end then change the color
  useEffect(() => {
    if (instance?.fontSize === f) {
      setTimeout(() => {
        if (iconRef.current) {
          iconRef.current['fill'](lightGray2)
        }
      }, 95)
    }
  }, [instance?.fontSize])

  return (
    <Group
      x={(index * 25) / zoom}
      y={0}
      onMouseEnter={() => setIsIconHovered(true)}
      onMouseLeave={() => setIsIconHovered(false)}
      onclick={() => resizeNote(f)}
    >
      <Rect
        fill={instance?.fontSize === f ? lightGray2 : white}
        cornerRadius={2 / zoom}
        width={22 / zoom}
        height={22 / zoom}
        ref={iconRef}
      />
      <Image
        image={f === 'H1' ? iconH1 : f === 'H2' ? iconH2 : iconH3}
        x={5 / zoom}
        y={5 / zoom}
        width={12 / zoom}
        height={12 / zoom}
      />
    </Group>
  )
}
// END - NOTE SIZE PICKER - END

// START - NOTE EDITOR - START
interface NoteEditorProps {
  closeEditor: () => void
  clearDraftNote?: () => void
  canvasId: string
  instance?: IPreviewInstance | null
  preview?: IPreview | null
  x: number
  y: number
  stagePosition: { x: number; y: number }
  zoom: number
  setScrollingLocked: (shouldLock: boolean) => void
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  closeEditor,
  canvasId,
  preview,
  instance,
  x,
  y,
  stagePosition,
  clearDraftNote,
  zoom,
  setScrollingLocked,
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const firestore = useContext(FirestoreContext)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState<string>(instance?.text || '')
  const [fontSize, setFontSize] = useState<string>(instance?.fontSize || 'H1')
  // If we are editing a saved instance, we have actual x, y coordinates
  // that need to be modified by canvas scroll / zoom. However, for a draft we have
  // the draft event coordinates, which are already untethered from
  // the canvas.
  const visualX = instance ? x * zoom + stagePosition.x : x
  const visualY = instance ? y * zoom + stagePosition.y : y

  // Prevent canvas scrolling and zooming while editor is open
  // Re-enable on editor close
  useEffect(() => {
    setScrollingLocked(true)
    return () => setScrollingLocked(false)
  }, [])

  // On opening of editor or font size select, focus the textarea and jump to end of text
  useEffect(() => {
    const textArea = textAreaRef.current
    if (textArea) {
      textArea.focus()
      textArea.scrollTop = 9999
      textArea.setSelectionRange(textArea.value.length, textArea.value.length)
    }
  }, [textAreaRef, fontSize])

  const saveOnClickAway = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!(editorRef.current && editorRef.current.contains(e.target as Node))) {
        const iId = instance?.instanceId
        const pId = preview?.previewId
        const trimmedVal = value.trim()
        if (iId && pId) {
          if (trimmedVal) {
            updatePreviewInstance(firestore, canvasId, pId, iId, {
              ...instance,
              text: trimmedVal,
              fontSize,
            })
          } else {
            deletePreviewInstance(firestore, canvasId, pId, iId)
          }
        } else {
          if (trimmedVal) {
            const [saveX, saveY] = getZoomedAndScrolledPosition([x, y], [stagePosition.x, stagePosition.y], zoom)
            createPreviewInstance(firestore, canvasId, saveX, saveY, {
              text: trimmedVal,
              fontSize,
              mime_type: NOTE_MIME_TYPE,
            })
          }
        }
        closeEditor()
        clearDraftNote?.()
      }
    },
    [value, preview, instance, canvasId, x, y, fontSize, editorRef],
  )
  useEffect(() => {
    document.addEventListener('click', saveOnClickAway)
    return () => document.removeEventListener('click', saveOnClickAway)
  }, [saveOnClickAway])

  const textAreaAdjust = () => {
    const textArea = textAreaRef.current
    const editor = editorRef.current
    if (textArea && editor) {
      textArea.style.height = '18px'
      textArea.style.height = `${Math.round(textArea.scrollHeight)}px`
    }
  }

  useEffect(() => {
    textAreaAdjust()
  }, [fontSize])

  const onChangeText = (e: SyntheticEvent) => {
    setValue((e.target as HTMLTextAreaElement).value)
  }

  const { editorWidth } = getFontProps(fontSize)
  /*
    @TODO Because we set the editor at a fixed position on the SCREEN
    (rather than on the canvas), without a constantly updating canvas position
    the editor stays locked on the screen at the position it was opened.

    This means that, for example, you open the editor while your note is in the
    bottom left corner of your screen and then scroll around, the editor will stay
    fixed to the bottom left corner of the screen even though the actual note itself
    may have been scrolled to a new position relative to the canvas.

    This is TEMPORARILY fixed by preventing scrolling and zooming while editor is open
    See useEffect above
  */
  return (
    <div
      className="noteEditorWrapper"
      style={{ top: visualY, left: visualX, width: editorWidth * zoom }}
      ref={editorRef}
    >
      <div className="noteEditorFontSizeRow">
        {fontSizes.map((f: string) => (
          <div
            key={f}
            className={`noteEditorFontSelector ${fontSize === f && 'fontSelectorActive'}`}
            onClick={() => setFontSize(f)}
          >
            <img className="noteEditorFontSelectorIcon" src={getFontProps(f).src} alt={f} />
          </div>
        ))}
      </div>
      <textarea
        ref={textAreaRef}
        value={value}
        className={`noteTextInput fontSize${fontSize}`}
        onChange={onChangeText}
        onInput={textAreaAdjust}
        style={{ transform: `scale(${zoom})`, width: editorWidth }}
      />
    </div>
  )
}
// END - NOTE EDITOR - END

// START - NOTE - START
interface NoteProps {
  setCursor: (cursorType: string) => void
  portalTargetRef: React.RefObject<HTMLDivElement>
  startWithEditOpen?: boolean
  x: number
  y: number
  canvasId: string
  instance: IPreviewInstance | null
  preview: IPreview | null
  clearDraftNote?: () => void
  selected?: boolean
  mediaAddToSelected?: (e: KonvaMouseEvt, mediaTuple: MossMediaSelectionTuple, xOr?: false) => void
  zoom: number
  stagePosition: any
  setScrollingLocked: (shouldLock: boolean) => void
  isHoldingSpacebar: boolean
  newMediaIdsRef?: React.RefObject<{ [key: string]: true }>
  selectedObjectCount?: number
  isMultiSelect?: boolean
}

const Note: React.FC<NoteProps> = ({
  setCursor,
  portalTargetRef,
  startWithEditOpen,
  x,
  y,
  canvasId,
  instance,
  preview,
  clearDraftNote,
  selected,
  mediaAddToSelected,
  zoom,
  stagePosition,
  setScrollingLocked,
  isHoldingSpacebar,
  newMediaIdsRef,
  isMultiSelect,
}) => {
  const initializedRef = useRef<boolean>(false)
  const textRef = useRef<KonvaElement>(null)
  const sizeGroupRef = useRef<KonvaElement>(null)
  const draggableRef = useRef<KonvaElement>()
  const [showTextEdit, setShowTextEdit] = useState<boolean>(!!startWithEditOpen)
  const [textDimensions, setTextDimensions] = useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const [isHovered, setIsHovered] = useState<boolean>(false)

  const iText = instance?.text || ''
  const { textMaxWidth, descender, iFontFamily, iFontSize, iLineHeight } = getFontProps(instance?.fontSize)

  useEffect(() => {
    if (preview && instance && mediaAddToSelected && newMediaIdsRef?.current?.[instance.instanceId]) {
      if (selected) {
        delete newMediaIdsRef.current[instance.instanceId]
      } else {
        mediaAddToSelected(
          { evt: { shiftKey: true } } as KonvaMouseEvt,
          [preview, instance, draggableRef.current],
          false,
        )
      }
    }
  }, [instance, mediaAddToSelected, preview, newMediaIdsRef])

  useEffect(() => {
    setTextDimensions({
      w: Math.min(textRef.current.width(), textMaxWidth),
      h: textRef.current.height(),
    })
  }, [textRef, iText, textMaxWidth, showTextEdit, selected])

  // @TODO At some point, combine all UseEffects under one master Media component
  useEffect(() => {
    if (isHovered) {
      fadeFill(textRef.current, darkGray3)
      fadeInOpacity(sizeGroupRef.current)
    } else {
      if (initializedRef.current && !selected) {
        fadeFill(textRef.current, darkGray2)
        fadeOutOpacity(sizeGroupRef.current)
      }
      initializedRef.current = true
    }
  }, [isHovered])

  const onTextDblClick = (e: KonvaMouseEvt) => {
    if (!(isMultiSelect && selected)) {
      setShowTextEdit(true)
    }
  }
  const closeEditor = () => setShowTextEdit(false)

  return (
    <Fragment>
      <Draggable
        canvasId={canvasId}
        x={x}
        y={y}
        preview={preview}
        instance={instance}
        draggable={!showTextEdit && !isHoldingSpacebar}
        onMouseLeave={() => setIsHovered(false)}
        draggableRef={draggableRef}
      >
        <Rect
          // empty rect to force larger hover area
          x={0}
          y={textDimensions.w * zoom > 22 ? -27 / zoom : 0}
          width={
            !textDimensions.w
              ? 0
              : textDimensions.w * zoom < 72 && textDimensions.w * zoom > 22
              ? 72 / zoom
              : textDimensions.w
          }
          height={
            !textDimensions.h ? 0 : textDimensions.w * zoom > 22 ? textDimensions.h + 27 / zoom : textDimensions.h
          }
        />
        <Group
          x={0}
          y={-27 / zoom}
          visible={
            showTextEdit ? false : selected ? true : textDimensions.w * zoom < 22 ? false : isHovered ? true : false
          }
          opacity={0}
          ref={sizeGroupRef}
        >
          {!(isMultiSelect && selected) && fontSizes.map((f: string, index) => (
            <NoteSize
              key={f}
              f={f}
              index={index}
              zoom={zoom}
              canvasId={canvasId}
              instance={instance}
              preview={preview}
            />
          ))}
        </Group>
        <Rect
          x={0}
          y={0}
          width={textDimensions.w ? textDimensions.w : 0}
          height={textDimensions.h ? textDimensions.h - descender : 0}
          stroke={lightGray3}
          strokeEnabled={selected && !showTextEdit && !isMultiSelect}
          cornerRadius={2 / zoom}
          strokeWidth={1}
          strokeScaleEnabled={false}
        />
        <Text
          x={0}
          y={0}
          text={showTextEdit ? '' : iText}
          fontFamily={iFontFamily}
          fontSize={iFontSize}
          lineHeight={iLineHeight / iFontSize}
          fill={selected ? black : darkGray2}
          onDblClick={onTextDblClick}
          onMouseDown={(e: KonvaMouseEvt) => {
            if (preview && instance && mediaAddToSelected && (!selected || e.evt.shiftKey)) {
              mediaAddToSelected(e, [preview, instance, draggableRef.current])
            }
          }}
          onClick={(e: KonvaMouseEvt) => (e.cancelBubble = true)}
          onMouseEnter={() => setIsHovered(true)}
          ref={textRef}
          /*
            @TODO Once the text has been expanded beyond the textMaxWidth
            it will remain at the max width size even if backspaced to
            under the max width until refresh.

            This is because the Text component doesn't have a good way to check
            what its width WOULD BE, only what its width is. Once width is set to
            textMaxWidth, that with becomes _the_ width, which persists
          */
          width={textRef.current?.width() >= textMaxWidth ? textMaxWidth : undefined}
        />
      </Draggable>
      {showTextEdit && (
        <Portal portalTargetRef={portalTargetRef}>
          <NoteEditor
            stagePosition={stagePosition}
            zoom={zoom}
            x={x}
            y={y}
            closeEditor={closeEditor}
            canvasId={canvasId}
            instance={instance}
            preview={preview}
            clearDraftNote={clearDraftNote}
            setScrollingLocked={setScrollingLocked}
          />
        </Portal>
      )}
    </Fragment>
  )
}
// END - NOTE - END

export default memo(
  Note,
  (prevProps, nextProps) =>
    prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    prevProps.instance?.fontSize === nextProps.instance?.fontSize &&
    prevProps.instance?.text === nextProps.instance?.text &&
    prevProps.canvasId === nextProps.canvasId &&
    prevProps.selected === nextProps.selected &&
    prevProps.zoom === nextProps.zoom &&
    prevProps.isHoldingSpacebar === nextProps.isHoldingSpacebar &&
    (prevProps.mediaAddToSelected === nextProps.mediaAddToSelected ||
      prevProps.selectedObjectCount === nextProps.selectedObjectCount),
)
