import React, { useContext, useCallback, useEffect } from 'react'
import { Group } from 'react-konva'
import { FirestoreContext } from '../../firebase'
import { IPreview, IPreviewInstance } from '../../types/previews'
import { KonvaElement, KonvaMouseEvt } from '../../types/konva'
import { IContainer } from '../../types/containers'

interface Props {
  children: React.ReactNode
  instance: IPreviewInstance | null
  draggable?: boolean
  draggableRef: React.RefObject<KonvaElement>
  x: number
  y: number
  height?: number
  width?: number
  canvasId: string
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onMouseDown?: (e: KonvaMouseEvt) => void
}

interface PreviewProps extends Props {
  preview: IPreview | null
}

interface ContainerProps extends Props {
  container: IContainer | null
  containerInstanceId: string
}

type DraggableProps = PreviewProps | ContainerProps

const Draggable: React.FC<DraggableProps> = props => {
  const {
    children,
    instance,
    draggable = true,
    draggableRef,
    x,
    y,
    height,
    width,
    canvasId,
    onMouseEnter,
    onMouseLeave,
    onMouseDown,
  } = props
  const { preview } = props as PreviewProps
  const { container, containerInstanceId } = props as ContainerProps
  const firestore = useContext(FirestoreContext)

  useEffect(() => {
    /*
      On resize, the Draggable component gets scaled.
      We then take that scale and apply it to the underlying media
      but if we don't then scale Draggable back to 1 the media will be scaled twice:

      Once from its own scale, and then again by the draggable scale.
    */
    if (draggableRef.current && draggableRef?.current?.scaleX() !== 1) {
      draggableRef.current.scale({ x: 1, y: 1 })
    }
  }, [children])

  const onDragEnd = useCallback(async () => {
    if (instance && (preview || container)) {
      let contentsProps
      if (preview) {
        const { previewId, instances = [] } = preview
        contentsProps = {
          contents: preview,
          instances,
          id: previewId,
          collection: 'previews',
        }
      } else {
        const { containerId, instances = [] } = container || {}
        contentsProps = {
          contents: container,
          instances,
          id: containerId,
          collection: 'containers',
        }
      }
      const newInstance = { ...instance }
      const node: KonvaElement = draggableRef.current
      newInstance.X = node.x()
      newInstance.Y = node.y()
      const newInstancesArray: IPreviewInstance[] = [...contentsProps.instances]
      const newInstanceIdx = newInstancesArray.findIndex(nInstance => nInstance.instanceId === instance.instanceId)
      newInstancesArray[newInstanceIdx] = newInstance
      await firestore
        .doc(`canvases/${canvasId}`)
        .collection(contentsProps.collection)
        .doc(contentsProps.id)
        .update({ instances: newInstancesArray })
    }
  }, [instance, canvasId, firestore])

  return (
    <Group
      draggable={draggable}
      x={x}
      y={y}
      containerInstanceId={containerInstanceId}
      height={height}
      width={width}
      ref={draggableRef}
      id={`${preview
          ? `preview_${preview.previewId}_${instance?.instanceId}`
          : `container_${container?.containerId}_${instance?.instanceId}`
        }`}
      onClick={(e: KonvaMouseEvt) => {
        e.cancelBubble = true
      }}
      onMouseDown={onMouseDown}
      onDragEnd={onDragEnd}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </Group>
  )
}

export default Draggable
