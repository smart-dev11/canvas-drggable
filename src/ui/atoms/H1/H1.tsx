import React from 'react'

import './H1.scss'

const H1 = ({ classList, children, ...props }: any) => (
  <h1 className={`heading ${classList && classList.join(' ')}`} {...props}>
    {children}
  </h1>
)

export default H1
