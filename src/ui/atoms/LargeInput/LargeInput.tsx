import React from 'react'

import './LargeInput.scss'

// might want to make this a variant of text input in the theme
const LargeInput = ({ classList, ...props }: any) => (
  <input type="text" className={`large-input ${classList && classList.join(' ')}`} {...props} />
)

export default LargeInput
