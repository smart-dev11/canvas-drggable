import React from 'react'
import { Link } from 'react-router-dom'

import './ImageButton.scss'

const ImageButton = ({ image, to, children, classList }: any) => (
  <Link to={to} style={{ textDecoration: 'none' }}>
    <div className={`image-btn ${classList && classList.join('')}`} style={{ backgroundImage: `url(${image})` }}>
      {children}
    </div>
  </Link>
)
export default ImageButton
