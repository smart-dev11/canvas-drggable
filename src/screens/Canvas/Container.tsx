import React, { useState, useEffect, useRef } from 'react'
import { Text, Group, Rect, Image } from 'react-konva'
import { URLImage } from './URLImage'
import useImage from 'use-image'

import Draggable from './Draggable'

import { KonvaElement, KonvaMouseEvt } from '../../types/konva'
import { IPreview } from '../../types/previews'
import { black, darkGray2, darkGray1, lightGray3, lightGray1 } from '../../constants/colors'
import { addPreviewToList } from '../../logic/firebase'
import { previewScale } from '../../logic/previews'

import iconLinked from '../../assets/icons/linked.png'
import iconUnlinked from '../../assets/icons/unlinked.png'
import iconLinkedReadOnly from '../../assets/icons/linked-readonly.png'
import iconUnlinkedReadOnly from '../../assets/icons/unlinked-readonly.png'
import iconFolderDefault from '../../assets/icons/folder-default.png'
import iconFolderHover from '../../assets/icons/folder-hover.png'
import iconFolderSelected from '../../assets/icons/folder-selected.png'

// @TODO Reinstate fades when we get rid of lag
// import { fadeFill, fadeStroke, fadeInOpacity, fadeOutOpacity } from '../../logic/animations'

// @TODO This component needs to be set up with proper typescript
// prop definitions & memoization
export const Container = (props: any) => {
  const draggableRef = useRef<KonvaElement>()
  const [selectedPreviews, setSelectedPreviews] = useState<any>([])
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const [isLinkHovered, setIsLinkHovered] = useState<boolean>(false)

  const [linked] = useImage(iconLinked)
  const [unlinked] = useImage(iconUnlinked)
  const [linkedReadOnly] = useImage(iconLinkedReadOnly)
  const [unlinkedReadOnly] = useImage(iconUnlinkedReadOnly)
  const [folderDefault] = useImage(iconFolderDefault)
  const [folderHover] = useImage(iconFolderHover)
  const [folderSelected] = useImage(iconFolderSelected)

  const textWidth = (props.container?.width * props.zoom) / props.zoom - 2 * props.iconOuterWidth
  const containerOuterHeight = props.container?.height - 60

  // @TODO Reinstate fades when we get rid of lag
  //
  // const initializedRef = useRef<boolean>(false)
  // const nameRef = useRef<KonvaElement>(null)
  // const borderRef = useRef<KonvaElement>(null)
  // const linkRectRef = useRef<KonvaElement>(null)
  //
  // useEffect(() => {
  //   if (!props.selected) {
  //     if (isHovered) {
  //       fadeFill(nameRef.current, darkGray2)
  //       fadeStroke(borderRef.current, darkGray1)
  //     } else {
  //       if (initializedRef.current) {
  //         fadeFill(nameRef.current, darkGray1)
  //         fadeStroke(borderRef.current, lightGray3)
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
    // if no activate container or it is not us, clear our previews
    if (
      !props.activeContainerInstance ||
      !(
        props.container.containerId === props.activeContainerInstance[0] &&
        props.instance.instanceId === props.activeContainerInstance[1]
      )
    ) {
      setSelectedPreviews([])
    }
  }, [props.activeContainerInstance, props.container.containerId, props.instance.instanceId])

  const clearSelected = (e: any) => {
    setSelectedPreviews([])
  }

  useEffect(() => {
    if (props.newMediaIdsRef?.current?.[props.instance.instanceId]) {
      if (props.selected) {
        delete props.newMediaIdsRef.current[props.instance.instanceId]
      } else {
        props.mediaAddToSelected(
          { evt: { shiftKey: true } } as KonvaMouseEvt,
          [props.container, props.instance, draggableRef.current],
          false,
        )
      }
    }
  }, [props.instance, props.mediaAddToSelected, props.preview, props.newMediaIdsRef])

  const updateSelectedPreviews = (e: KonvaMouseEvt, preview: IPreview) => {
    e.cancelBubble = true
    if (e.evt.shiftKey) {
      if (selectedPreviews.filter((prev: IPreview) => prev.previewId === preview.previewId).length === 0)
        setSelectedPreviews([...selectedPreviews, preview])
    } else {
      setSelectedPreviews([preview])
    }
    if (props?.onPreviewClick) {
      props.onPreviewClick(e, props.container, props.instance, draggableRef.current)
    }
  }

  let linkStatusImage = linked
  let linkActive = false
  if (props.linked) {
    if (props.readOnly) {
      linkStatusImage = linkedReadOnly
    } else {
      linkStatusImage = linked
      linkActive = true
    }
  } else {
    if (props.readOnly) {
      linkStatusImage = unlinkedReadOnly
    } else {
      linkStatusImage = unlinked
    }
  }

  return (
    <Draggable
      draggableRef={draggableRef}
      instance={props.instance}
      x={props.X}
      y={props.Y}
      height={props.container?.height}
      width={props.container?.width}
      containerInstanceId={props.containerInstanceId}
      canvasId={props.canvasId}
      onMouseDown={(e: KonvaMouseEvt) => {
        clearSelected(e)
        if (props?.mediaAddToSelected && props?.container && props.instance && (!props.selected || e.evt.shiftKey)) {
          props.mediaAddToSelected(e, [props.container, props.instance, draggableRef.current])
        }
        if (props?.onMouseDown && !props?.isHoldingSpacebar) {
          props.onMouseDown(e)
        }
      }}
      container={props.container}
      onMouseLeave={() => setIsHovered(false)}
      draggable={!props?.isHoldingSpacebar}
    >
      <Rect
        x={0}
        y={0}
        width={props.container?.width}
        height={props.container?.height - 60}
        cornerRadius={2 / props.zoom}
        stroke={props.selected ? black : isHovered ? darkGray1 : lightGray3}
        strokeWidth={1}
        strokeScaleEnabled={false}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      <Group
        x={0}
        y={0}
        width={props.container?.width}
        height={props.container?.height}
        onMouseEnter={() => setIsHovered(true)}
      >
        {props.container?.previews?.map((preview: any, idx: number) => {
          if (!preview.linked) return null
          const scale = previewScale(preview)
          const [width, height] = preview.dimensions
          return (
            <URLImage
              isNested
              canvasId={props.canvasId}
              preview={preview}
              isLinked={preview.linked}
              readOnly={preview.daemonId !== props.daemonId}
              instance={null}
              X={preview.containerX}
              Y={preview.containerY}
              width={width}
              height={height}
              name={preview.previewName}
              key={idx}
              scale={scale}
              src={preview?.url}
              updatedAt={preview?.updatedAt}
              draggable={false}
              onMouseDown={(e: KonvaMouseEvt) => updateSelectedPreviews(e, preview)}
              selected={selectedPreviews.filter((prev: IPreview) => prev.previewId === preview.previewId).length > 0}
              inContainer
              initContainerPreviewsDrag={(e: KonvaMouseEvt, currentPreview: IPreview) => {
                // because selection on mousedown is async we cant guarantee selectedPreviews is up to date
                // so form the final list based on selectedPreviews, the preview just clicked on, and the shift key
                const previewList = e.evt.shiftKey
                  ? addPreviewToList(currentPreview, selectedPreviews)
                  : [currentPreview]
                console.log(
                  'container pass through canvas drag of selectedPreviews',
                  props.instance.X,
                  props.instance.Y,
                )
                props.initContainerPreviewsDrag(
                  e,
                  previewList,
                  props.instance.X,
                  props.instance.Y,
                  props.containerInstanceId,
                )
              }}
              fontSize={props.fontSize}
              iconOuterWidth={props.iconOuterWidth}
              iconPadding={props.iconPadding}
              iconWidth={props.iconWidth}
              paddingTop={props.paddingTop}
              minTextWidth={props.minTextWidth}
              zoom={props.zoom}
            />
          )
        })}
      </Group>
      <Image
        image={props.selected ? folderSelected : isHovered ? folderHover : folderDefault}
        x={0}
        y={containerOuterHeight + props.paddingTop}
        width={textWidth < props.minTextWidth ? 0 : props.iconWidth}
        height={textWidth < props.minTextWidth ? 0 : props.iconWidth}
      />
      <Text
        x={props.iconWidth + props.iconPadding}
        y={containerOuterHeight + props.paddingTop}
        fill={props.selected ? black : isHovered ? darkGray2 : darkGray1}
        text={props.container?.containerName || 'loading...'}
        lineHeight={1.15}
        width={textWidth < props.minTextWidth ? 0 : textWidth}
        fontSize={props.fontSize}
        fontFamily={'Lab Grotesque Light'}
        ellipsis={true}
        wrap={'none'}
      />
      <Group
        x={props.container?.width - props.iconOuterWidth}
        y={containerOuterHeight + props.paddingTop - props.iconPadding}
        width={textWidth < props.minTextWidth ? 0 : props.iconOuterWidth}
        height={textWidth < props.minTextWidth ? 0 : props.iconOuterWidth}
        onClick={(e: any) => (linkActive ? props.onOpenObject(e, props.container, false) : null)}
        onMouseEnter={() => setIsLinkHovered(true)}
        onMouseLeave={() => setIsLinkHovered(false)}
      >
        <Rect
          fill={lightGray1}
          fillEnabled={isLinkHovered ? true : false}
          width={textWidth < props.minTextWidth ? 0 : props.iconOuterWidth}
          height={textWidth < props.minTextWidth ? 0 : props.iconOuterWidth}
          cornerRadius={2 / props.zoom}
        />
        <Image
          image={linkStatusImage}
          x={props.iconPadding}
          y={props.iconPadding}
          width={textWidth < props.minTextWidth ? 0 : props.iconWidth}
          height={textWidth < props.minTextWidth ? 0 : props.iconWidth}
        />
      </Group>
    </Draggable>
  )
}
