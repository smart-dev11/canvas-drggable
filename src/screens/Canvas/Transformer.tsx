import React, { useRef, useEffect } from 'react'
import { Transformer as KonvaTransformer } from 'react-konva'
import { KonvaElement } from '../../types/konva'

interface Props {
  showTransformer: boolean
  enableAnchors: boolean
  nodes: KonvaElement[]
  updateStamp?: Date
  hideStroke?: boolean
}

const Transformer: React.FC<Props> = ({ enableAnchors, showTransformer, nodes, updateStamp, hideStroke }) => {
  const transformerRef = useRef<KonvaElement>()

  useEffect(() => {
    if (transformerRef.current && showTransformer) {
      transformerRef.current.nodes(nodes)
      transformerRef.current.getLayer()?.batchDraw()
    } else {
      transformerRef.current.nodes([])
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [nodes, showTransformer, updateStamp])

  return (
    <KonvaTransformer
      anchorStroke="#121212"
      anchorFill="#FCFCFC"
      anchorSize={7}
      borderStroke="#121212"
      borderStrokeWidth={1}
      borderEnabled={!hideStroke}
      ref={transformerRef}
      boundBoxFunc={(oldBox, newBox) => {
        // limit resize
        if (newBox.width < 5 || newBox.height < 5) {
          return oldBox
        }
        return newBox
      }}
      rotateEnabled={false}
      keepRatio={true}
      enabledAnchors={enableAnchors ? ['top-left', 'top-right', 'bottom-left', 'bottom-right'] : []}
    />
  )
}

export default Transformer
