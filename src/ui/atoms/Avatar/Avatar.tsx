import React from 'react'

import './Avatar.scss'

const Avatar = ({ classList, ...props }: any) => (
  <img className={`avatar ${classList && classList.join(' ')}`} {...props} />
)

export default Avatar
