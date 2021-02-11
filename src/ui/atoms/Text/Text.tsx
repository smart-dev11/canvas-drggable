import React from 'react'

import './Text.scss'

const Text = ({ classList, children, ...props }: any) => (
  <p className={`text-block ${classList && classList.join(' ')}`} {...props}>
    {children}
  </p>
)

export default Text
