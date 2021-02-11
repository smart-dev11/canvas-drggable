import { KonvaEventObject } from 'konva/types/Node'

// @TODO Figure out the Konva element typings
// The Konva documentation doesn't seem to be correct re: typings
export type KonvaElement = any

export type KonvaMouseEvt = KonvaEventObject<MouseEvent>

export type KonvaTransformEvt = KonvaEventObject<Event>
