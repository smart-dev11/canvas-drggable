const duration = 0.095

export const fadeFill = (layer: any, color: string) => {
  layer.to({
    duration: duration,
    fill: color,
  })
}

export const fadeStroke = (layer: any, color: string) => {
  layer.to({
    duration: duration,
    stroke: color,
  })
}

export const fadeInOpacity = (layer: any) => {
  layer.to({
    duration: duration,
    opacity: 1,
  })
}

export const fadeOutOpacity = (layer: any) => {
  layer.to({
    duration: duration,
    opacity: 0,
  })
}
