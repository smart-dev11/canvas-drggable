import React from 'react'

import './PrimaryButton.scss'

interface Props {
  children: React.ReactNode
  classList?: string[]
  onClick?: () => void
}

const PrimaryButton: React.FC<Props> = ({ children, classList, onClick }: any) => (
  <button className={`primary-btn ${classList && classList.join(' ')}`} onClick={onClick}>
    {children}
  </button>
)

export default PrimaryButton
