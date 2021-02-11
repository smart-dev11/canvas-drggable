import { useEffect } from 'react'
import symmetricDifferenceWith from 'ramda/src/symmetricDifferenceWith'
import { MossMediaSelectionTuple, isPreviewCanvasMedia, MossMediaTuple } from '../types/moss'
import { Firestore, FirebaseMediaCollection } from '../types/firebase'
import { IPreviewInstance } from '../types/previews'
import { AreaCoords } from '../types/moss'
import { CONTAINER_META_HEIGHT } from '../constants/moss'
import { NOTE_MIME_TYPE } from '../constants/mimeTypes'

import { deletePreviewInstance, deleteContainerInstance, addPreviewInstance, addContainerInstance } from './firebase'

export const createDeleteSelected = ({
  selectedObjectsRef,
  firestore,
  canvasId,
  setSelectedObjects,
  setActiveContainerInstance,
  setCursor,
}: {
  selectedObjectsRef: React.RefObject<MossMediaSelectionTuple[]>
  firestore: Firestore
  canvasId: string
  setSelectedObjects: (objects: []) => void
  setActiveContainerInstance: (instances: null) => void
  setCursor: (cursor: string) => void
}) => () => {
  if (!selectedObjectsRef.current || selectedObjectsRef.current.length === 0) return
  for (const selectedTuple of selectedObjectsRef.current) {
    const [media, { instanceId }] = selectedTuple
    if (isPreviewCanvasMedia(media)) {
      deletePreviewInstance(firestore, canvasId, media.previewId, instanceId)
    } else {
      deleteContainerInstance(firestore, canvasId, media.containerId, instanceId)
    }
  }
  setSelectedObjects([])
  setActiveContainerInstance(null)
  setCursor('default')
}

export const createPasteSelected = ({
  selectedObjectsRef,
  firestore,
  canvasId,
  setSelectedObjects,
  setActiveContainerInstance,
  newMediaIdsRef,
}: {
  selectedObjectsRef: React.RefObject<MossMediaSelectionTuple[]>
  firestore: Firestore
  canvasId: string
  setSelectedObjects: (objects: []) => void
  setActiveContainerInstance: (instances: null) => void
  newMediaIdsRef: React.MutableRefObject<{ [key: string]: boolean }>
}) => async () => {
  if (!selectedObjectsRef.current || selectedObjectsRef.current.length === 0) return
  for (const selectedTuple of selectedObjectsRef.current) {
    const [media, instance] = selectedTuple
    if (isPreviewCanvasMedia(media)) {
      const { X: sourceX, Y: sourceY, scale, text, fontSize } = instance as IPreviewInstance
      addPreviewInstance(
        firestore,
        canvasId,
        media.previewId,
        {
          X: sourceX + 20,
          Y: sourceY + 20,
          ...(scale && { scale }),
          ...(text && { text }),
          ...(fontSize && { fontSize }),
        },
        newMediaIdsRef,
      )
    } else {
      addContainerInstance(firestore, canvasId, media.containerId, instance.X + 20, instance.Y + 20, instance.scale)
    }
  }
  setSelectedObjects([])
  setActiveContainerInstance(null)
}

const compareSelectedIds = (primaryTuple: MossMediaTuple, secondaryTuple: MossMediaTuple) => {
  const [primaryMedia, primaryInstance] = primaryTuple
  const [secondaryMedia, secondaryInstance] = secondaryTuple

  let matchedMediaIds = false
  if (isPreviewCanvasMedia(primaryMedia) && isPreviewCanvasMedia(secondaryMedia)) {
    matchedMediaIds = primaryMedia.previewId === secondaryMedia.previewId
  } else {
    matchedMediaIds = primaryMedia.containerId === secondaryMedia.containerId
  }
  return matchedMediaIds && primaryInstance.instanceId === secondaryInstance.instanceId
}

export const isInstanceSelected = (tuple: MossMediaTuple, selectedObjects: MossMediaSelectionTuple[]) =>
  selectedObjects.findIndex(selectedTuple => compareSelectedIds(selectedTuple, tuple)) !== -1

export const createUpdateSelectedObjects = ({
  selectedObjects,
  setActiveContainerInstance,
  setSelectedObjects,
}: {
  selectedObjects: MossMediaSelectionTuple[]
  setActiveContainerInstance: (instances: null) => void
  setSelectedObjects: (objects: MossMediaSelectionTuple[]) => void
}) => (shouldCombine: boolean, incomingSelectedTuples: MossMediaSelectionTuple[], xOr: boolean = true) => {
  let newSelectedObjects = selectedObjects
  if (shouldCombine) {
    // https://ramdajs.com/docs/#symmetricDifferenceWith
    // Creates a new array of tuples that combines current & incoming while
    // excluding any tuples that exist in both arrays
    if (xOr) {
      newSelectedObjects = symmetricDifferenceWith(
        (selected, incoming) => compareSelectedIds(selected, incoming),
        newSelectedObjects,
        incomingSelectedTuples,
      )
    } else {
      newSelectedObjects = [...newSelectedObjects, ...incomingSelectedTuples]
    }
  } else {
    newSelectedObjects = incomingSelectedTuples
  }
  setActiveContainerInstance(null)
  setSelectedObjects(newSelectedObjects)
}

export const useSelectedArea = ({
  selectedObjects,
  selectedAreaCoordsRef,
  previews,
  zoom,
}: {
  selectedObjects: MossMediaSelectionTuple[]
  selectedAreaCoordsRef: React.MutableRefObject<AreaCoords>
  previews: FirebaseMediaCollection
  zoom: number
}) =>
  useEffect(() => {
    if (selectedObjects.length) {
      const newCoords: AreaCoords = selectedObjects.reduce(
        (acc, obj, i) => {
          let mediaWidth
          let mediaHeight
          let mediaScale
          const element = obj[2]
          let { x, y } = element.attrs
          let elementPadding = 0
          if (isPreviewCanvasMedia(obj[0])) {
            if (obj[0].mime_type === NOTE_MIME_TYPE) {
              const { width, height } = obj[2].getClientRect()
              // getClientRect gives us the dimensions with zoom factored in
              // but we already scale the selectable area by zoom later
              // so we need to reverse the zoom calculation here or else it is zoomed twice
              mediaWidth = width / zoom
              mediaHeight = height / zoom
              mediaScale = 1
            } else {
              const { dimensions } = obj[0]
              const { scale } = obj[1]
              mediaWidth = dimensions[0]
              mediaHeight = dimensions[1]
              // Because we're pulling the media dimensions and not the
              // element dimensions, we need to adjust the select area
              y = y - (1 / zoom)
              x = x - (1 / zoom)
              elementPadding = 2 / zoom
              mediaScale = scale
            }
          } else {
            const { width, height } = obj[0]
            mediaWidth = width
            mediaHeight = height - CONTAINER_META_HEIGHT
            mediaScale = 1
          }
          const brX = x + mediaWidth * mediaScale
          const brY = y + mediaHeight * mediaScale
          if (i === 0) {
            return [x, y, brX + elementPadding, brY + elementPadding]
          }
          // Array order is top left x, top left y, bottom right x, bottom right y
          acc[0] = Math.min(acc[0], x)
          acc[1] = Math.min(acc[1], y)
          acc[2] = Math.max(acc[2], brX + elementPadding)
          acc[3] = Math.max(acc[3], brY + elementPadding)
          return acc
        },
        [0, 0, 0, 0],
      )
      selectedAreaCoordsRef.current = newCoords
    } else {
      selectedAreaCoordsRef.current = null
    }
    // This gets updated on previews because after moving a preview
    // we need to update the selected area to the preview's new position
  }, [selectedObjects, previews, zoom])
