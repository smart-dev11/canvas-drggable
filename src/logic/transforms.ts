import { KonvaElement, KonvaTransformEvt } from '../types/konva'
import { IPreview, IPreviewInstance } from '../types/previews'
import { Firestore } from '../types/firebase'

export const createTransformMedia = ({
  instance,
  mediaRef,
  preview,
  canvasId,
  firestore,
  setIsTransforming,
}: {
  instance: IPreviewInstance | null
  mediaRef: React.RefObject<KonvaElement> | undefined
  preview: IPreview
  canvasId: string
  firestore: Firestore
  setIsTransforming?: (isTransforming: false) => void
}) => (e: KonvaTransformEvt) => {
  if (instance && mediaRef) {
    let newInstance = { ...instance }
    const node: KonvaElement = mediaRef.current

    const xChange = node.x()
    const yChange = node.y()
    const newX = node.parent.parent.attrs.x + xChange
    const newY = node.parent.parent.attrs.y + yChange
    const newScale = node.scaleX()

    newInstance = {
      ...newInstance,
      X: newX,
      Y: newY,
      scale: newScale,
    }

    /*
        When the image is transformed its X and Y coordinates change.
        However, they change WITHIN the group wrapping them,
        which we update after the image transform via newInstance.
        We need to reset the image's x,y to 0,0
        so that it remains in place within the group after the
        transforms are set.
      */
    node.x(0)
    node.y(0)
    const newInstancesArray: { instanceId: string }[] = [...preview.instances]
    const newInstanceIdx = newInstancesArray.findIndex(nInstance => nInstance.instanceId === instance.instanceId)
    newInstancesArray[newInstanceIdx] = newInstance
    firestore
      .doc(`canvases/${canvasId}`)
      .collection('previews')
      .doc(preview.previewId)
      .update({ instances: newInstancesArray })
    setIsTransforming?.(false)
  }
}
