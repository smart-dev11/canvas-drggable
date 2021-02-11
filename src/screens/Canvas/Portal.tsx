// Konva doesn't support the React createPortal API
// This portal component is a modified version of their suggested workaround
// See https://konvajs.org/docs/react/DOM_Portal.html

import React, { useEffect, Fragment } from 'react'
import ReactDOM from 'react-dom'

interface Props {
  children: React.ReactElement | null
  portalTargetRef: React.RefObject<HTMLDivElement>
}

const Portal: React.FC<Props> = ({ children, portalTargetRef }) => {
  useEffect(() => {
    const targetNode = portalTargetRef.current
    if (children && targetNode) {
      ReactDOM.render(children, targetNode)
    }
    return () => {
      if (targetNode) {
        ReactDOM.render(<Fragment />, targetNode)
      }
    }
  }, [portalTargetRef, children])

  return null
}

export default Portal
