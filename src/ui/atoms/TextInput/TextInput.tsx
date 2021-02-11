import React from 'react'

import './TextInput.scss'

const TextInput = ({ classList, ...props }: any) => (
  <span className="input--container">
    <input className={`input--default ${classList && classList.join(' ')}`} {...props} />
  </span>
)
export default TextInput
