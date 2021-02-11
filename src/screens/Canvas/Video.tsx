import React, { useEffect, useState, useRef, useMemo, useContext, useCallback } from 'react'
import { Group, Image, Text, Rect } from 'react-konva'
import useImage from 'use-image'
import Konva from 'konva'
import { secondsToTimeCode } from '../../logic/util'
import { IPreview, IPreviewInstance } from '../../types/previews'
import { KonvaElement, KonvaMouseEvt } from '../../types/konva'
import { MossMediaSelectionTuple } from '../../types/moss'
import { black, darkGray2, darkGray1, lightGray1, white } from '../../constants/colors'

import { createTransformMedia } from '../../logic/transforms'
import { FirestoreContext } from '../../firebase'

// @TODO Reinstate fades when we get rid of lag
// import { fadeFill, fadeInOpacity, fadeOutOpacity } from '../../logic/animations'

import Draggable from './Draggable'
import Transformer from './Transformer'

import iconLinked from '../../assets/icons/linked.png'
import iconUnlinked from '../../assets/icons/unlinked.png'
import iconLinkedReadOnly from '../../assets/icons/linked-readonly.png'
import iconUnlinkedReadOnly from '../../assets/icons/unlinked-readonly.png'

import iconVideoDefault from '../../assets/icons/video-default.png'
import iconVideoHover from '../../assets/icons/video-hover.png'
import iconVideoSelected from '../../assets/icons/video-selected.png'

import iconPauseDefault from '../../assets/icons/pause-default.png'
import iconPauseHover from '../../assets/icons/pause-hover.png'
import iconPlayDefault from '../../assets/icons/play-default.png'
import iconPlayHover from '../../assets/icons/play-hover.png'
import iconReplay from '../../assets/icons/replay.png'

interface Props {
  src: string
  previewSrc?: string
  updatedAt: any
  name?: string
  selected: boolean
  readOnly?: boolean
  draggable?: boolean
  canvasId: string
  inContainer?: boolean
  X: number
  Y: number
  isLinked?: boolean
  newMediaIdsRef: React.RefObject<{ [key: string]: true }>
  isMultiSelect?: boolean

  instance: IPreviewInstance
  preview: IPreview

  // Functions
  onMouseDown?: ((e: KonvaMouseEvt) => void) | null
  initContainerPreviewsDrag?: (e: any, preview: any) => any
  onOpenObject?: (e: KonvaMouseEvt, preview: any, arg2: boolean) => any
  mediaAddToSelected: (e: KonvaMouseEvt, mediaTuple: MossMediaSelectionTuple, xOr?: false) => void

  // Style props
  width: number
  height: number
  scale: number
  zoom?: number
  iconOuterWidth: number
  iconWidth: number
  paddingTop: number
  minTextWidth: number
  iconPadding: number
  fontSize: number
}

export const Video: React.FC<Props> = ({
  src,
  previewSrc,
  updatedAt,
  name = '',
  X,
  Y,
  width,
  height,
  scale,
  zoom = 1,
  iconOuterWidth,
  selected,
  readOnly,
  isLinked,
  draggable,
  instance,
  preview,
  canvasId,
  inContainer,
  iconWidth,
  onMouseDown,
  initContainerPreviewsDrag,
  onOpenObject,
  paddingTop,
  minTextWidth,
  iconPadding,
  fontSize,
  mediaAddToSelected,
  newMediaIdsRef,
  isMultiSelect,
}) => {
  const imgRef = useRef<KonvaElement>()
  const draggableRef = useRef<KonvaElement>()

  const firestore = useContext(FirestoreContext)

  const [isHovered, setIsHovered] = useState<boolean>(false)
  const [isLinkHovered, setIsLinkHovered] = useState<boolean>(false)
  const [isTransforming, setIsTransforming] = useState<boolean>(false)

  const [linked] = useImage(iconLinked)
  const [unlinked] = useImage(iconUnlinked)
  const [linkedReadOnly] = useImage(iconLinkedReadOnly)
  const [unlinkedReadOnly] = useImage(iconUnlinkedReadOnly)

  const [iconDefault] = useImage(iconVideoDefault)
  const [iconHover] = useImage(iconVideoHover)
  const [iconSelected] = useImage(iconVideoSelected)
  const [isPlayHovered, setIsPlayHovered] = useState<boolean>(false)

  const [imgPauseDefault] = useImage(iconPauseDefault)
  const [imgPauseHover] = useImage(iconPauseHover)
  const [imgPlayDefault] = useImage(iconPlayDefault)
  const [imgPlayHover] = useImage(iconPlayHover)
  const [imgReplay] = useImage(iconReplay)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [isTimeHovered, setIsTimeHovered] = useState<boolean>(false)

  const textWidth = width * scale - 2 * iconOuterWidth

  const transformMedia = useCallback(
    createTransformMedia({
      instance,
      preview,
      mediaRef: imgRef,
      canvasId,
      firestore,
      setIsTransforming,
    }),
    [preview, canvasId, firestore],
  )

  const roundCorners = (ctx: any) => {
    const x = 0
    const y = 0
    const scaledWidth = width * scale
    const scaledHeight = height * scale
    const radius = 2 / zoom

    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + scaledWidth - radius, y)
    ctx.quadraticCurveTo(x + scaledWidth, y, x + scaledWidth, y + radius)
    ctx.lineTo(x + scaledWidth, y + scaledHeight - radius)
    ctx.quadraticCurveTo(x + scaledWidth, y + scaledHeight, x + scaledWidth - radius, y + scaledHeight)
    ctx.lineTo(x + radius, y + scaledHeight)
    ctx.quadraticCurveTo(x, y + scaledHeight, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  // @TODO Reinstate fades when we get rid of lag
  //
  //  const initializedRef = useRef<boolean>(false)
  // const nameRef = useRef<KonvaElement>(null)
  // const borderRef = useRef<KonvaElement>(null)
  // const linkRectRef = useRef<KonvaElement>(null)
  //
  // useEffect(() => {
  //   if (!selected) {
  //     if (isHovered) {
  //       fadeFill(nameRef.current, darkGray2)
  //       fadeInOpacity(borderRef.current)
  //     } else {
  //       if (initializedRef.current) {
  //         fadeFill(nameRef.current, darkGray1)
  //         fadeOutOpacity(borderRef.current)
  //       }
  //       initializedRef.current = true
  //     }
  //   }
  // }, [isHovered])
  //
  // useEffect(() => {
  //   if (isLinkHovered && linkActive) {
  //     fadeInOpacity(linkRectRef.current)
  //   } else {
  //     if (initializedRef.current) {
  //       fadeOutOpacity(linkRectRef.current)
  //     }
  //     initializedRef.current = true
  //   }
  // }, [isLinkHovered])

  useEffect(() => {
    if (newMediaIdsRef?.current?.[instance.instanceId]) {
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

  const updateCurrentTime = () => {
    const newTime = Math.floor(videoElement.currentTime)
    if (newTime !== currentTime) {
      setCurrentTime(newTime)
    }
  }
  const videoElement = useMemo(() => {
    const element = document.createElement('video')
    element.loop = true
    element.ontimeupdate = updateCurrentTime
    return element
  }, [])

  // update the video element when src changes
  useEffect(() => {
    if (src || previewSrc) {
      // @TODO Videos don't display initial frame because setting src
      // doesn't trigger re-render
      videoElement.src = (src || previewSrc) + '#t=0.1'
      if (src && previewSrc) {
        URL.revokeObjectURL(previewSrc)
      }
    }
  }, [videoElement, src, previewSrc])

  const togglePlayVideo = () => {
    if (videoElement) {
      const layer = imgRef.current.getLayer()
      const anim = new Konva.Animation(() => {}, layer)
      if (isPlaying) {
        videoElement.pause()
        anim.stop()
        setIsPlaying(false)
      } else {
        videoElement.play()
        anim.start()
        setIsPlaying(true)
      }
    }
  }

  let linkStatusImage = linked
  let linkActive = false
  if (isLinked) {
    if (readOnly) {
      linkStatusImage = linkedReadOnly
    } else {
      linkStatusImage = linked
      linkActive = true
    }
  } else {
    if (readOnly) {
      linkStatusImage = unlinkedReadOnly
    } else {
      linkStatusImage = unlinked
    }
  }

  let videoButtonImage = imgPlayDefault
  if (isPlaying) {
    if (isPlayHovered) {
      videoButtonImage = imgPauseHover
    } else {
      videoButtonImage = imgPauseDefault
    }
  } else {
    if (isPlayHovered) {
      videoButtonImage = imgPlayHover
    } else {
      videoButtonImage = imgPlayDefault
    }
  }

  return (
    <Draggable
      draggable={draggable}
      x={X}
      y={Y}
      preview={preview}
      canvasId={canvasId}
      instance={instance}
      draggableRef={draggableRef}
    >
      <Group clipFunc={!inContainer && selected ? null : roundCorners}>
        <Image
          scale={{
            x: scale,
            y: scale,
          }}
          width={width}
          height={height}
          image={videoElement}
          ref={imgRef}
          onTransformStart={() => setIsTransforming(true)}
          onTransformEnd={transformMedia}
          fill={lightGray1}
        />
      </Group>

      <Rect
        x={0}
        y={0}
        width={width * scale}
        height={height * scale}
        cornerRadius={2 / zoom}
        strokeWidth={1}
        strokeScaleEnabled={false}
        stroke={inContainer && selected ? black : darkGray1}
        strokeEnabled={
          inContainer && selected
            ? true
            : (isHovered && !selected) || (isTimeHovered && !selected) || (isPlayHovered && !selected)
            ? true
            : false
        }
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={async (e: KonvaMouseEvt) => {
          if (!selected || e.evt.shiftKey) {
            mediaAddToSelected(e, [preview, instance, draggableRef.current])
          }
          if (onMouseDown) {
            onMouseDown(e)
          }
          if (!inContainer) return

          e.cancelBubble = true
          if (initContainerPreviewsDrag) {
            initContainerPreviewsDrag(e, preview)
          }
        }}
        ondblclick={(e: KonvaMouseEvt) => (linkActive ? onOpenObject?.(e, preview, true) : null)}
        onClick={e => {
          // we need to cancel propagation so stage is able to intentionally deselect everything
          // for clicks on blank stage
          e.cancelBubble = true
        }}
      />

      <Image
        image={selected ? iconSelected : isHovered || isTimeHovered || isPlayHovered ? iconHover : iconDefault}
        x={0}
        y={height * scale + paddingTop}
        width={textWidth < minTextWidth || isTransforming || iconWidth == null ? 0 : iconWidth}
        height={textWidth < minTextWidth || isTransforming || iconWidth == null ? 0 : iconWidth}
      />
      <Text
        x={iconWidth + iconPadding}
        y={height * scale + paddingTop}
        fill={selected ? black : isHovered || isTimeHovered || isPlayHovered ? darkGray2 : darkGray1}
        text={name}
        lineHeight={1.25}
        width={textWidth < minTextWidth || isTransforming || iconWidth == null ? 0 : textWidth}
        fontSize={fontSize}
        fontFamily={'Lab Grotesque Light'}
        ellipsis={true}
        wrap={'none'}
      />
      <Group
        x={width * scale - iconOuterWidth}
        y={height * scale + paddingTop - iconPadding}
        onClick={(e: KonvaMouseEvt) => (linkActive ? onOpenObject?.(e, preview, false) : null)}
        onMouseEnter={() => (linkActive ? setIsLinkHovered(true) : null)}
        onMouseLeave={() => (linkActive ? setIsLinkHovered(false) : null)}
      >
        <Rect
          fill={lightGray1}
          fillEnabled={isLinkHovered ? true : false}
          width={textWidth < minTextWidth || isTransforming || iconWidth == null ? 0 : iconOuterWidth}
          height={textWidth < minTextWidth || isTransforming || iconWidth == null ? 0 : iconOuterWidth}
          cornerRadius={2 / zoom}
        />
        <Image
          image={linkStatusImage}
          x={iconPadding}
          y={iconPadding}
          width={textWidth < minTextWidth || isTransforming || iconWidth == null ? 0 : iconWidth}
          height={textWidth < minTextWidth || isTransforming || iconWidth == null ? 0 : iconWidth}
        />
      </Group>

      {(src || previewSrc) && (
        <Group>
          <Image
            image={videoButtonImage}
            width={iconOuterWidth}
            height={iconOuterWidth}
            x={3 / zoom}
            y={height * scale - iconOuterWidth - 3 / zoom}
            onClick={e => {
              togglePlayVideo()
              e.cancelBubble = true
            }}
            onMouseEnter={() => setIsPlayHovered(true)}
            onMouseLeave={() => setIsPlayHovered(false)}
            visible={width * scale * zoom < 90 || isTransforming || iconWidth == null ? false : true}
          />
          <Group
            x={width * scale - 60 / zoom}
            y={height * scale - iconWidth - 8 / zoom}
            onClick={e => {
              videoElement.currentTime = 0
              setCurrentTime(0)
              e.cancelBubble = true
            }}
            onMouseEnter={() => setIsTimeHovered(true)}
            onMouseLeave={() => setIsTimeHovered(false)}
            visible={width * scale * zoom < 90 || isTransforming || iconWidth == null ? false : true}
          >
            <Image
              x={0}
              y={-5 / zoom}
              image={imgReplay}
              width={iconOuterWidth}
              height={iconOuterWidth}
              opacity={isTimeHovered ? 1 : 0}
            />
            <Text
              width={30 / zoom}
              height={iconWidth}
              x={iconOuterWidth}
              y={0}
              text={secondsToTimeCode(currentTime === 0 && !isPlaying ? videoElement.duration : currentTime)}
              fill={isTimeHovered ? white : lightGray1}
              align={'right'}
              shadowColor={black}
              shadowBlur={4}
              shadowOpacity={0.8}
              shadowEnabled={true}
              lineHeight={1.25}
              fontSize={fontSize}
              fontFamily={'Lab Grotesque Light'}
              wrap={'none'}
            />
          </Group>
        </Group>
      )}
      {instance && imgRef.current && (
        <Transformer
          nodes={[imgRef.current]}
          showTransformer={selected && !inContainer && !isMultiSelect}
          enableAnchors={!isMultiSelect}
        />
      )}
    </Draggable>
  )
}
