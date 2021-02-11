import React from 'react'

import './Header.scss'
import logo from '../../../assets/logo/moss_icon_256x256.png'

const Header = () => (
  <header className="header">
    <img src={logo} alt="moss icon" className="header__logo" />
  </header>
)

export default Header
