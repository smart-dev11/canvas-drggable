import { KonvaElement } from './konva'

export interface IContainerInstance {
  X: number
  Y: number
  scale: number
  instanceId: string
}

export interface IContainer {
  containerId: string
  directoryId: string
  name: string
  createdAt: firebase.firestore.Timestamp
  updatedAt: firebase.firestore.Timestamp
  instances: IContainerInstance[]
  previews: any[]
  linked: boolean
  daemonId: string
  width: number
  height: number
}

export type ContainerTuple = [IContainer, IContainerInstance, KonvaElement]
