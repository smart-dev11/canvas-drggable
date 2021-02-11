import { firestore } from 'firebase'
import { useEffect, useContext } from 'react'
import { useObservable } from 'rxjs-hooks'
import { collection } from 'rxfire/firestore'
import { FirestoreContext } from '../firebase'
import { IContainer } from '../types/containers'
import { ContainerIPreviews } from '../types/previews'
import { Firestore } from '../types/firebase'
import { arrayToObjectByProperty } from '../logic/util'

export function containersQuery(firestore: Firestore, canvasId: string) {
  return firestore.doc(`canvases/${canvasId}`).collection('containers')
}

export function useContainers(canvasId: string) {
  const firestore = useContext(FirestoreContext)

  return useObservable(() => collection(firestore.doc(`canvases/${canvasId}`).collection('containers')))
}

export const useSetContainersData = (
  containers: firestore.QueryDocumentSnapshot<firestore.DocumentData>[] | null,
  containerPreviews: ContainerIPreviews,
  setContainersData: (data: { [key: string]: IContainer }) => void,
) => {
  return useEffect(() => {
    if (containers) {
      // @TODO I suspect that if we started keeping track of which container ID was updated we could skip some of this mapping
      const newData = containers.map(container => {
        const data = container.data() as IContainer
        if (data.instances.length) {
          data.containerId = container.id
          const mappedContainerPreviews = containerPreviews[data.containerId]
          if (mappedContainerPreviews) {
            data.previews = Object.keys(mappedContainerPreviews)
              .map(previewId => mappedContainerPreviews[previewId])
              .flat()
          }
          return data 
        }
      }).filter(x => x) as IContainer[]
      setContainersData(arrayToObjectByProperty(newData, 'containerId'))
    }
  }, [containers, containerPreviews])
}
