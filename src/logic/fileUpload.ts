import WSC from '../WebSocketClient'
import { MyFile } from '../types/files'
import { KonvaElement } from '../types/konva'
import { getZoomedAndScrolledPosition } from './canvasInteraction'

const uploadFiles = ({
  fileList,
  event,
  canvasId,
  stageRef,
  zoom,
  localPreviewsDataRef,
}: {
  fileList: FileList | null
  event: DragEvent | { clientX: number; clientY: number }
  canvasId: string
  stageRef: React.RefObject<KonvaElement> // Konva Stage
  zoom: number
  localPreviewsDataRef: React.MutableRefObject<{ [key: string]: string }>
}) => {
  if (!fileList) {
    return
  }

  const files: any = []
  Array.from(fileList).forEach(file => {
    const myFile = file as MyFile
    if (myFile.type) {
      // https://stackoverflow.com/questions/922057/is-it-possible-to-preview-local-images-before-uploading-them-via-a-form
      localPreviewsDataRef.current[myFile.name] = URL.createObjectURL(file)
    }
    files.push({
      lastModified: myFile.lastModified,
      lastModifiedDate: myFile.lastModifiedDate,
      fileName: myFile.name,
      size: myFile.size,
      type: myFile.type,
    })
  })
  const { x: stageOffsetX, y: stageOffsetY } = stageRef.current.position()
  const [relativeX, relativeY] = getZoomedAndScrolledPosition(
    [event.clientX, event.clientY],
    [stageOffsetX, stageOffsetY],
    zoom,
  )
  const message = {
    action: 'add_sync_targets',
    data: {
      files,
      canvasId: canvasId,
      dropX: relativeX,
      dropY: relativeY,
    },
  }

  //send off the list of files to the backend for instantiation
  WSC.send(JSON.stringify(message))
}

export const createOnFileDrop = ({
  connectedToServerRef,
  setDropAttempted,
  setIsLoading,
  canvasId,
  stageRef,
  zoom,
  localPreviewsDataRef,
}: {
  connectedToServerRef: React.RefObject<boolean>
  stageRef: React.RefObject<KonvaElement> // Konva Stage
  setDropAttempted: (hasAttempted: boolean) => void
  setIsLoading: (isLoading: boolean) => void
  canvasId: string
  zoom: number
  localPreviewsDataRef: React.MutableRefObject<{ [key: string]: string }>
}) => (fileList: FileList | null, event: any) => {
  if (!connectedToServerRef.current) {
    setDropAttempted(true)
    alert(
      "Sorry, you are not conected to Moss.. either you have not installed our desktop app, or it has crashed and can't restart.",
    )
    return
  }
  if (fileList) {
    setIsLoading(true) // This is turned off in the onMessage handler
  }
  uploadFiles({ fileList, event, canvasId, stageRef, zoom, localPreviewsDataRef })
}
