import { KonvaElement } from './konva'

export interface IPreviewInstance {
  X: number
  Y: number
  scale: number
  instanceId: string
  text?: string
  fontSize?: string
}

export interface IPreview {
  previewId: string
  previewName: string
  containerId?: string
  containerX?: number
  containerY?: number
  assetId: string
  name: string
  url: string
  mime_type: string
  dimensions: [number, number]
  createdAt: firebase.firestore.Timestamp
  updatedAt: firebase.firestore.Timestamp
  instances: IPreviewInstance[]
  linked: boolean
  daemonId: string
  uploadPreviewUrl?: string
}

export type ContainerIPreviews = {
  [key: string]: {
    [key: string]: IPreview
  }
}

export type DragContainerPreviews = {
  previews: IPreview[]
  startX: number
  startY: number
  instanceX: number
  instanceY: number
  containerInstanceId: string
}

export type PreviewTuple = [IPreview, IPreviewInstance, KonvaElement]
