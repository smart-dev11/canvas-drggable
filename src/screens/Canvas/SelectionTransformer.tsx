import React, { useMemo, useRef } from 'react'
import { Group, Rect } from 'react-konva'
import { KonvaElement } from '../../types/konva'
import { IPreview } from '../../types/previews'
import { AreaCoords, MossMediaSelectionTuple } from '../../types/moss'
import Transformer from './Transformer'

/*
  Because the Transformer takes the top-level draggable as nodes
  but we want the selected area to appear as wrapping only the media
  we need to disable the borderStroke on Transformer and instead
  fake it with this SelectionArea rect
*/
interface RectProps {
  selectedAreaCoordsRef: React.RefObject<AreaCoords>
  rectRef: React.RefObject<KonvaElement>
  showRect: boolean
}

// @TODO Rectangle can appear over other media elements if we wrap it in a draggable
const SelectionArea: React.FC<RectProps> = ({ selectedAreaCoordsRef, rectRef, showRect }) => {
  if (selectedAreaCoordsRef.current && showRect) {
    const [tlX, tlY, brX, brY] = selectedAreaCoordsRef.current
    return (
      <Rect
        ref={rectRef}
        id="selectionArea"
        stroke="#121212"
        strokeWidth={1}
        x={tlX}
        y={tlY}
        height={brY - tlY}
        width={brX - tlX}
        strokeScaleEnabled={false}
      />
    )
  }
  return null
}

/*
  This component used to be used for transforms (aka resizing) with multiple selections.
  This was removed in https://github.com/philosophie/moss-canvas-app/pull/75 due to
  Konva limitations. 

  If we decide to add that functionality back, the above PR could be helpful
  in determining how this was previously being done.
*/

interface Props {
  selectedObjects: MossMediaSelectionTuple[]
  previews: { [key: string]: IPreview }
  children: KonvaElement[]
  canvasId: string
  selectedAreaCoordsRef: React.RefObject<AreaCoords>
}

const SelectionTransformer: React.FC<Props> = ({
  selectedObjects,
  children,
  previews,
  canvasId,
  selectedAreaCoordsRef,
}) => {
  const rectRef = useRef<KonvaElement>(null)
  const nodes = useMemo(() => {
    const newNodes = selectedObjects.map(selectedTuple => selectedTuple[2])
    if (rectRef.current) {
      newNodes.push(rectRef.current)
    }
    return newNodes
  }, [selectedObjects, previews, rectRef.current])

  return (
    <Group>
      <SelectionArea
        showRect={selectedObjects.length > 1}
        rectRef={rectRef}
        selectedAreaCoordsRef={selectedAreaCoordsRef}
      />
      {children}
      <Transformer showTransformer={selectedObjects.length > 1} enableAnchors={false} nodes={nodes} hideStroke />
    </Group>
  )
}

export default SelectionTransformer
