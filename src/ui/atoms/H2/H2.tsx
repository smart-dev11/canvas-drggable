import React from 'react'

import './H2.scss'

const H2 = ({ classList, children, ...props }: any) => (
  <h1 className={`subheading ${classList && classList.join(' ')}`} {...props}>
    {children}
  </h1>
)

export default H2
