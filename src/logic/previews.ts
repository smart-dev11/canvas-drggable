import { NOTE_MIME_TYPE } from '../constants/mimeTypes'

export const previewScale = (preview: any) => {
  return 150 / preview.dimensions[0]
}

export const isVideo = (preview: any) => {
  return preview.mime_type === 'video/mp4' || preview.mime_type === 'video/quicktime'
}

export const isNote = (preview: any) => {
  return preview.mime_type === NOTE_MIME_TYPE
}
