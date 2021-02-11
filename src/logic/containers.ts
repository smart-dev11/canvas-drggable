import { getZoomedAndScrolledPosition } from './canvasInteraction'
import { addPreviewInstance } from './firebase'
import { DragContainerPreviews } from '../types/previews'
import { Firestore, FirebaseDocument } from '../types/firebase'
import { KonvaElement } from '../types/konva'
import { previewScale } from './previews'

export const nullDragContainerPreviews = {
  previews: [],
  startX: 0,
  startY: 0,
  instanceX: 0,
  instanceY: 0,
  containerInstanceId: 'not-a-container-instance-id',
}

export const createInitContainersPreviewDrag = (
  stageRef: React.RefObject<KonvaElement>,
  setDragContainerPreviews: (previews: DragContainerPreviews) => void,
  zoom: number,
) => (e: any, selectedPreviews: any, instanceX: number, instanceY: number, containerInstanceId: string) => {
  const { x, y } = e.evt
  const { x: stageOffsetX, y: stageOffsetY } = stageRef.current.position()
  const [relativeX, relativeY] = getZoomedAndScrolledPosition([x, y], [stageOffsetX, stageOffsetY], zoom)
  setDragContainerPreviews({
    previews: selectedPreviews,
    startX: relativeX,
    startY: relativeY,
    instanceX: instanceX,
    instanceY: instanceY,
    containerInstanceId,
  })
}

export const createCompleteContainerPreviewsDrag = ({
  dragContainerPreviews,
  containers,
  stageRef,
  setDragContainerPreviews,
  zoom,
  canvasId,
  firestore,
  newMediaIdsRef,
}: {
  dragContainerPreviews: DragContainerPreviews
  containers: FirebaseDocument[] | null
  stageRef: React.RefObject<KonvaElement> // Konva Stage
  setDragContainerPreviews: (previews: DragContainerPreviews) => void
  zoom: number
  canvasId: string
  firestore: Firestore
  newMediaIdsRef: React.MutableRefObject<{ [key: string]: boolean }>
}) => (e: any) => {
  // Check if there are any drag container previews
  if (dragContainerPreviews.previews.length === 0) {
    console.warn('completeContainerPreviewsDrag with 0 previews')
  }

  // Check if there are any containers that match the currently dragged file
  const containerId = dragContainerPreviews.previews[0].containerId
  const container_ref = containers?.find((container: any) => container.id === containerId)
  if (!container_ref) {
    console.warn('completeContainerPreviewsDrag could not find container with containerId=', containerId)
  }

  // Get drop event coordinates and then scale them for zoom and pan
  const { x, y } = e.evt
  const { x: stageOffsetX, y: stageOffsetY } = stageRef.current.position()
  const [relativeX, relativeY] = getZoomedAndScrolledPosition([x, y], [stageOffsetX, stageOffsetY], zoom)

  // Get the container node and if it exists, check to see if the dropped event was within
  // the bounds of that container ...
  const containerInstanceKonvaNode: [any] = stageRef.current.find((node: any) => {
    return node.attrs.containerInstanceId === dragContainerPreviews.containerInstanceId
  })

  if (containerInstanceKonvaNode?.[0]) {
    const coordinates = containerInstanceKonvaNode[0].getClientRect()
    const [containerX, containerY] = getZoomedAndScrolledPosition(
      [coordinates.x, coordinates.y],
      [stageOffsetX, stageOffsetY],
      zoom,
    )
    const leftBounded = relativeX >= containerX
    const rightBounded = relativeX <= containerX + coordinates.width / zoom
    const topBounded = relativeY >= containerY
    const bottomBounded = relativeY <= containerY + coordinates.height / zoom

    const droppedInContainer = leftBounded && rightBounded && topBounded && bottomBounded

    // ... if it was dropped w/i the container, clear the preview and do nothing ...
    if (droppedInContainer) {
      setDragContainerPreviews(nullDragContainerPreviews)
      return
    }
  } else {
    console.warn('completeContainerPreviewsDrag error: could not find the container instance node')
    setDragContainerPreviews(nullDragContainerPreviews)
    return
  }

  // ... otherwise, create a new preview instance at the drop location
  const containerOriginX = dragContainerPreviews.instanceX
  const containerOriginY = dragContainerPreviews.instanceY
  const deltaX = relativeX - dragContainerPreviews.startX
  const deltaY = relativeY - dragContainerPreviews.startY
  for (const preview of dragContainerPreviews.previews) {
    const scale = previewScale(preview)
    const { containerX = 0, containerY = 0 } = preview
    const previewX = containerOriginX + containerX + deltaX
    const previewY = containerOriginY + containerY + deltaY
    addPreviewInstance(firestore, canvasId, preview.previewId, { X: previewX, Y: previewY, scale }, newMediaIdsRef)
  }

  setDragContainerPreviews(nullDragContainerPreviews)
}
