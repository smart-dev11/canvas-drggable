import React from 'react'

import './Canvas.scss'

const Canvas = ({ classList, ...props }: any) => (
  <canvas className={`canvas ${classList && classList.join(' ')}`} {...props} />
)

export default Canvas
