/* eslint-disable */

import React, { useState, useEffect, useRef } from 'react'
import { Canvas } from '../../atoms/'

// this is a lot more complicated than it needs to be
// could strip a lot of the options out and improve this
// pulled it in from another project

const CanvasOrganism = props => {
  const [mouseDown, setMouseDown] = useState(false)
  const [brushColor, setBrushColor] = useState('black')
  const [mouseLocation, setMouseLocation] = useState([0, 0])
  const [moved, setMoved] = useState(false)
  const [bb, setBB] = useState({})
  const [context, setContext] = useState(null)
  const canvasRef = useRef()

  // Prevent scrolling when touching the canvas
  // idk what the deal with this is
  useEffect(() => {
    const canvas = canvasRef.current
    document.body.addEventListener(
      'touchstart',
      function(e) {
        if (e.target === canvas) {
          e.preventDefault()
        }
      },
      { passive: false },
    )
    document.body.addEventListener(
      'touchend',
      function(e) {
        if (e.target === canvas) {
          e.preventDefault()
        }
      },
      { passive: false },
    )
    document.body.addEventListener(
      'touchmove',
      function(e) {
        if (e.target === canvas) {
          e.preventDefault()
        }
      },
      { passive: false },
    )
  }, [])

  useEffect(
    () => {
      const canvas = canvasRef.current
      const { brushCol, lineWidth } = props
      const context = canvas.getContext('2d')
      const bb = canvas.getBoundingClientRect()

      setBB(bb)
      setContext(context)

      context.lineWidth = '4'
      context.strokeStyle = brushColor
      context.lineJoin = 'round'
      context.lineCap = 'round'
    },
    [brushColor, props],
  )

  useEffect(
    () => {
      if (context && context.strokeStyle) {
        context.strokeStyle = brushColor
      }
    },
    [brushColor, context],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    window.addEventListener('resize', () => {
      const bb = canvas.getBoundingClientRect()
      setBB(bb)
    })
  })

  const onMouseDown = e => {
    e.preventDefault()
    setMoved(false)
    if (!mouseDown) setMouseDown(true)
    setMouseLocation([e.pageX || e.touches[0].pageX, e.pageY || e.touches[0].pageY])
    context.beginPath()

    context.moveTo((e.pageX || e.touches[0].pageX) - bb.left, (e.pageY || e.touches[0].pageY) - bb.top)
  }

  const clearCanvas = () => {
    context.clearRect(0, 0, props.width, props.height)
  }

  useEffect(() => {
    window.addEventListener('clearCanvas', () => {})
  }, [])

  const onClick = e => {
    if (e.pageX || e.touches[0]) {
      context.beginPath()
      context.lineTo((e.pageX || e.touches[0].pageX) - bb.left, (e.pageY || e.touches[0].pageY) - bb.top)

      context.lineTo((e.pageX || e.touches[0].pageX) - bb.left, (e.pageY || e.touches[0].pageY) - bb.top - 1)
      context.stroke()
    }
  }

  const onMouseUp = e => {
    e.preventDefault()
    setMouseDown(false)
    props.onMouseUp(canvasRef.current.toDataURL())
  }

  const onMouseMove = e => {
    e.preventDefault()
    e.stopPropagation()
    if (mouseDown) {
      setMoved(true)
      // prevent IOS scroll when drawing

      if (true || ((e.pageX || e.touches[0].pageX) > 0 && (e.pageY || e.touches[0].pageY) < props.height)) {
        context.lineTo((e.pageX || e.touches[0].pageX) - bb.left, (e.pageY || e.touches[0].pageY) - bb.top)

        context.stroke()
      }
    }
  }

  return (
    <div style={{ zIndex: 10000 }} className={props.className}>
      <Canvas
        ref={canvasRef}
        className={`${props.className}__canvas`}
        width={props.width}
        height={props.height}
        onClick={onClick}
        style={Object.assign({}, props.style, {
          width: props.width,
          background: 'white',
          height: props.height,
          border: '2px dotted rgba(0,0,0,0.6)',
        })}
        onMouseDown={onMouseDown}
        onTouchStart={onMouseDown}
        onMouseUp={onMouseUp}
        onTouchEnd={onMouseUp}
        onMouseMove={onMouseMove}
        onTouchMove={onMouseMove}
        onMouseLeave={onMouseUp}
      />
      <div onClick={clearCanvas}>Clear</div>
    </div>
  )
}

export default CanvasOrganism
