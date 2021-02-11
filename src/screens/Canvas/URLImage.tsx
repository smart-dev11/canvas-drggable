import React, { useEffect, useState, useRef, useCallback, useContext } from 'react'
import { Group, Image, Text, Rect } from 'react-konva'
import useImage from 'use-image'
import { IPreview, IPreviewInstance } from '../../types/previews'
import { KonvaElement, KonvaMouseEvt } from '../../types/konva'
import { MossMediaSelectionTuple } from '../../types/moss'
import { black, darkGray2, darkGray1, lightGray1 } from '../../constants/colors'

import { createTransformMedia } from '../../logic/transforms'
import { FirestoreContext } from '../../firebase'

import iconLinked from '../../assets/icons/linked.png'
import iconUnlinked from '../../assets/icons/unlinked.png'
import iconLinkedReadOnly from '../../assets/icons/linked-readonly.png'
import iconUnlinkedReadOnly from '../../assets/icons/unlinked-readonly.png'
import iconImageDefault from '../../assets/icons/image-default.png'
import iconImageHover from '../../assets/icons/image-hover.png'
import iconImageSelected from '../../assets/icons/image-selected.png'
import iconPSD from '../../assets/icons/psd.png'

// @TODO Reinstate fades when we get rid of lag
// import { fadeFill, fadeInOpacity, fadeOutOpacity } from '../../logic/animations'

import Draggable from './Draggable'
import Transformer from './Transformer'

interface Props {
  src: string | null
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
  isNested?: boolean
  newMediaIdsRef?: React.RefObject<{ [key: string]: true }>
  isMultiSelect?: boolean

  instance: IPreviewInstance | null
  preview: IPreview

  // Functions
  onMouseDown?: ((e: KonvaMouseEvt) => void) | null
  initContainerPreviewsDrag?: (e: any, preview: IPreview) => any
  onOpenObject?: (e: any, preview: IPreview, arg2: boolean) => any
  mediaAddToSelected?: (e: KonvaMouseEvt, mediaTuple: MossMediaSelectionTuple, xOr?: false) => void

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

export const URLImage: React.FC<Props> = ({
  src,
  previewSrc,
  updatedAt,
  name = '',
  width,
  scale,
  zoom = 1,
  iconOuterWidth,
  selected,
  readOnly,
  draggable,
  X,
  Y,
  instance,
  preview,
  canvasId,
  inContainer,
  iconWidth,
  height,
  onMouseDown,
  initContainerPreviewsDrag,
  onOpenObject,
  paddingTop,
  minTextWidth,
  iconPadding,
  fontSize,
  isLinked,
  isNested,
  mediaAddToSelected,
  newMediaIdsRef,
  isMultiSelect,
}) => {
  const firestore = useContext(FirestoreContext)
  const imgRef = useRef<KonvaElement>()
  const draggableRef = useRef<KonvaElement>()
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const [isLinkHovered, setIsLinkHovered] = useState<boolean>(false)
  const [isTransforming, setIsTransforming] = useState<boolean>(false)

  const ext = name.substr(name.lastIndexOf('.') + 1).toLowerCase()
  const isPhotoShop = ext === 'psd' || ext === 'psb'

  /*
    cache bust with the updatedAt time UNLESS src is a preview blob

    @TODO For some reason image becomes undefined during the renders when
    transitioning to src from previewSrc for the first time
    this causes a flash of grey loading rectangle and on slow connections
    seems to disrupt the select-on-drop flow.
  */
  let imgSrc = ''
  if (src) {
    imgSrc = `${src}?${updatedAt.toMillis()}`
  } else if (!isPhotoShop) {
    imgSrc = previewSrc || ''
  }
  const [image] = useImage(imgSrc)
  if (src && previewSrc && image) {
    URL.revokeObjectURL(previewSrc)
  }

  const transformMedia = useCallback(
    createTransformMedia({
      instance,
      preview,
      firestore,
      canvasId,
      mediaRef: imgRef,
      setIsTransforming,
    }),
    [firestore, preview, canvasId],
  )

  const [linked] = useImage(iconLinked)
  const [unlinked] = useImage(iconUnlinked)
  const [linkedReadOnly] = useImage(iconLinkedReadOnly)
  const [unlinkedReadOnly] = useImage(iconUnlinkedReadOnly)
  const [iconDefault] = useImage(isPhotoShop ? iconPSD : iconImageDefault)
  const [iconHover] = useImage(isPhotoShop ? iconPSD : iconImageHover)
  const [iconSelected] = useImage(isPhotoShop ? iconPSD : iconImageSelected)

  const textWidth = (width * scale * zoom) / zoom - 2 * iconOuterWidth

  const roundCorners = (ctx: KonvaElement) => {
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
  // const initializedRef = useRef<boolean>(false)
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
    if (instance && mediaAddToSelected && newMediaIdsRef?.current?.[instance.instanceId]) {
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

  return (
    <Draggable
      draggable={draggable}
      x={X}
      y={Y}
      instance={instance}
      preview={preview}
      canvasId={canvasId}
      draggableRef={draggableRef}
    >
      <Group clipFunc={!inContainer && selected ? null : roundCorners}>
        <Image
          width={width}
          height={height}
          scale={{
            x: scale,
            y: scale,
          }}
          image={image}
          ref={imgRef}
          onTransformStart={() => {
            setIsTransforming(true)
          }}
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
        strokeEnabled={inContainer && selected ? true : isHovered && !selected ? true : false}
        stroke={inContainer && selected ? black : darkGray1}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={async (e: KonvaMouseEvt) => {
          if (preview && instance && mediaAddToSelected && (!selected || e.evt.shiftKey) && !isNested) {
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
        image={selected ? iconSelected : isHovered ? iconHover : iconDefault}
        x={0}
        y={height * scale + paddingTop}
        width={textWidth < minTextWidth || isTransforming || iconWidth == null ? 0 : iconWidth}
        height={textWidth < minTextWidth || isTransforming || iconWidth == null ? 0 : iconWidth}
      />
      <Text
        x={iconWidth + iconPadding}
        y={height * scale + paddingTop}
        fill={selected ? black : isHovered ? darkGray2 : darkGray1}
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
        onClick={(e: any) => (linkActive ? onOpenObject?.(e, preview, false) : null)}
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
