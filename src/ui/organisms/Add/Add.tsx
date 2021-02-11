import React from 'react'
import { PrimaryButton } from '../../atoms/'

import './Add.scss'

const Add = () => (
  <div className="add__wrapper">
    <PrimaryButton classList={['add', 'small', 'light-border']}>+&nbsp; add</PrimaryButton>
    <p className="tip">👋&nbsp; Coming soon—drag & drop files for now.</p>
  </div>
)

export default Add
