import { firestore } from 'firebase'
import { IContainer } from './containers'
import { IPreview } from './previews'
import { MyFile } from './files'

export type Firestore = firebase.firestore.Firestore

export type FirebaseDocument = firestore.QueryDocumentSnapshot<firestore.DocumentData>

export type FirebaseMediaCollection = firestore.QueryDocumentSnapshot<firestore.DocumentData>[] | null

export type AddTargetObject = {
  data: IPreview | IContainer
  path: string
  status: 'success' | 'ambiguous' | 'error'
  target: MyFile
  target_type: 'asset' | 'directory'
}

export type FirebaseAddTargetMessage = {
  action: string
  data: {
    canvasId: string
    dropX: number
    dropY: number
    files: MyFile[]
  }
  result: {
    objects: AddTargetObject[]
  }
}

export interface AddPreviewInstance {
  (
    firestore: Firestore,
    canvasId: string,
    previewId: string,
    objectProps: {
      X: number
      Y: number
      scale?: number
      text?: string
      fontSize?: string
    },
    newMediaIdsRef?: React.MutableRefObject<{ [key: string]: boolean }>,
  ): Promise<string>
}
