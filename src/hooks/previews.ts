import { useContext, useEffect } from 'react'
import { useObservable } from 'rxjs-hooks'
import { collection } from 'rxfire/firestore'
import { FirestoreContext } from '../firebase'

import { IPreview, ContainerIPreviews } from '../types/previews'
import { IContainer } from '../types/containers'
import { FirebaseDocument, Firestore } from '../types/firebase'
import { NOTE_MIME_TYPE } from '../constants/mimeTypes'
import { arrayToObjectByProperty } from '../logic/util'

export function previewsQuery(firestore: Firestore, canvasId: string) {
  return firestore.doc(`canvases/${canvasId}`).collection('previews')
}

export function usePreviews(canvasId: string) {
  const firestore = useContext(FirestoreContext)

  return useObservable(() => collection(firestore.doc(`canvases/${canvasId}`).collection('previews')))
}

export const useSetPreviewsData = ({
  setPreviewsData,
  setContainerPreviews,
  previews,
  containerPreviews,
  localPreviewsDataRef,
  containersData,
}: {
  setPreviewsData: (previews: { [key: string]: IPreview }) => void
  setContainerPreviews: (previews: ContainerIPreviews) => void
  previews: FirebaseDocument[] | null
  containerPreviews: ContainerIPreviews
  localPreviewsDataRef: React.MutableRefObject<{ [key: string]: string }>
  containersData: { [key: string]: IContainer }
  }) => {
  const containersCount = Object.keys(containersData).length
  useEffect(() => {
    if (previews) {
      const previewsData: any[] = []
      let shouldUpdateCPreviews = false
      const newContainerPreviews = { ...containerPreviews }
      for (const preview of previews) {
        const data = preview.data() as IPreview
        if (data.instances.length || (data.containerId && containersData[data.containerId])) {
          data.previewId = preview.id
          if (!data.url) {
            data.uploadPreviewUrl = localPreviewsDataRef.current[data.previewName]
          }
          // because Konva assigns z-indexes based on render order
          // and we want notes to always display on top of other elements
          // we add notes to the end of the preview array
          // otherwise, add to front
          if (data.mime_type === NOTE_MIME_TYPE) {
            previewsData.push(data)
          } else {
            previewsData.unshift(data)
          }
          // keep track of which previews belong to containers for use when rendering the containers
          if (data.containerId) {
            // @TODO We can probably be smarter about only updating this if
            // something in a container is updated rather than if anything is updated
            // AND some of the previews (modified or not) happen to be in containers
            shouldUpdateCPreviews = true
            newContainerPreviews[data.containerId] = {
              ...newContainerPreviews[data.containerId],
              [data.previewId]: data,
            }
          }
        }
      }
      setPreviewsData(arrayToObjectByProperty(previewsData, 'previewId'))
      if (shouldUpdateCPreviews) {
        setContainerPreviews(newContainerPreviews)
      }
    }
  }, [previews, containersCount])
}
