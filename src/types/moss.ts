import { IPreview, IPreviewInstance, PreviewTuple } from './previews'
import { IContainer, ContainerTuple, IContainerInstance } from './containers'

export type MossCanvasMedia = IPreview | IContainer

export const isPreviewCanvasMedia = (obj: MossCanvasMedia): obj is IPreview => (obj as IPreview).previewId !== undefined

export type MossMediaSelectionTuple = PreviewTuple | ContainerTuple

export type MossMediaTuple = MossMediaSelectionTuple | [IPreview, IPreviewInstance] | [IContainer, IContainerInstance]

export type AreaCoords = [number, number, number, number] | null
