import { v4 as uuidv4 } from 'uuid'
import * as firebase from 'firebase/app'
import { previewsQuery } from '../hooks/previews'
import { containersQuery } from '../hooks/containers'
import { AddPreviewInstance, Firestore } from '../types/firebase'

export const addPreviewInstance: AddPreviewInstance = async (
  firestore,
  canvasId,
  previewId,
  objectProps,
  newMediaIdsRef,
) => {
  const instanceId = uuidv4()
  if (newMediaIdsRef) {
    newMediaIdsRef.current = { ...newMediaIdsRef.current, [instanceId]: true }
  }
  await previewsQuery(firestore, canvasId)
    .doc(previewId)
    .update({
      instances: firebase.firestore.FieldValue.arrayUnion({
        instanceId,
        ...objectProps,
      }),
    })
    .catch(error => {
      alert('Error adding preview instance: ' + error)
      debugger
    })
  return instanceId
}

export const createPreviewInstance = async (
  firestore: Firestore,
  canvasId: string,
  X: number,
  Y: number,
  additionalProps?: {
    text?: string
    fontSize?: string
    scale?: number
    mime_type?: string
  },
) => {
  const instanceId = uuidv4()
  await previewsQuery(firestore, canvasId)
    .add({
      ...(additionalProps?.mime_type && { mime_type: additionalProps?.mime_type }),
      instances: firebase.firestore.FieldValue.arrayUnion({
        X,
        Y,
        instanceId,
        ...additionalProps,
      }),
    })
    .catch(error => {
      alert(`Error creating preview: ${error}`)
    })
}

export const updatePreviewInstance = async (
  firestore: Firestore,
  canvasId: string,
  previewId: string,
  instanceId: string,
  updatedInstance: {},
) => {
  const preview: any = await previewsQuery(firestore, canvasId).doc(previewId).get()
  const instances = preview.data().instances
  const instanceIdx = instances.findIndex((e: { instanceId: string }) => e.instanceId === instanceId)
  const newInstancesArray = [...instances]
  newInstancesArray[instanceIdx] = updatedInstance
  await previewsQuery(firestore, canvasId)
    .doc(previewId)
    .update({ instances: newInstancesArray })
    .catch(error => {
      alert(`Error updating preview instances: ${error}`)
    })
}

export const deletePreviewInstance = async (
  firestore: Firestore,
  canvasId: string,
  previewId: string,
  instanceId: string,
) => {
  const preview: any = await previewsQuery(firestore, canvasId).doc(previewId).get()
  const newInstancesArray = preview.data().instances.filter((instance: any) => instance.instanceId !== instanceId)
  if (preview.data().instances.length !== newInstancesArray.length)
    await previewsQuery(firestore, canvasId)
      .doc(previewId)
      .update({ instances: newInstancesArray })
      .catch(error => {
        alert('Error deleting preview instance: ' + error)
        debugger
      })
}

// add a preview to a list of previews if not already present
export const addPreviewToList = (preview: any, previews: any) => {
  if (previews.filter((prev: any) => prev.previewId === preview.previewId).length === 0) return [...previews, preview]
  return previews
}

export const getContainer = async (firestore: Firestore, canvasId: string, containerId: string) => {
  const container = await containersQuery(firestore, canvasId)
    .doc(containerId)
    .get()
    .catch(function (error: any) {
      console.warn('Error getting container:', error)
    })
  return container
}

export const addContainerInstance = async (
  firestore: Firestore,
  canvasId: string,
  containerId: string,
  X: number,
  Y: number,
  scale: number,
) => {
  const instanceId = uuidv4()
  await containersQuery(firestore, canvasId)
    .doc(containerId)
    .update({
      instances: firebase.firestore.FieldValue.arrayUnion({
        X,
        Y,
        scale,
        instanceId,
      }),
    })
    .catch((error: any) => {
      alert('Error adding container instance: ' + error)
      debugger
    })
}

export const deleteContainerInstance = async (
  firestore: Firestore,
  canvasId: string,
  containerId: string,
  instanceId: string,
) => {
  const container: any = await containersQuery(firestore, canvasId).doc(containerId).get()
  const newInstancesArray = container.data().instances.filter((instance: any) => instance.instanceId !== instanceId)
  if (container.data().instances.length !== newInstancesArray.length)
    await containersQuery(firestore, canvasId)
      .doc(containerId)
      .update({ instances: newInstancesArray })
      .catch(error => {
        alert('Error deleting container instance: ' + error)
        debugger
      })
}
