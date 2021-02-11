import React from 'react'
import { PrimaryButton } from '../../atoms/'

import menu from '../../../assets/icons/menu.svg'
import menuSyncing from '../../../assets/icons/menu-syncing.gif'

import './Menu.scss'

// overlay just covers everything else while the menu's open
// not 100% sure on that interaction, but it works ok
function openMenu() {
  var menu = document.getElementById('menu')
  if (menu != undefined) {
    menu.classList.remove('closed')
  }
  var overlay = document.getElementById('overlay')
  if (overlay != undefined) {
    overlay.classList.remove('closed')
  }
}

function closeMenu() {
  var menu = document.getElementById('menu')
  if (menu != undefined) {
    menu.classList.add('closed')
  }
  var overlay = document.getElementById('overlay')
  if (overlay != undefined) {
    overlay.classList.add('closed')
  }
}

const Menu = ({ classList, ...props }: any) => (
  <div className={classList && classList.join(' ')}>
    <div onClick={closeMenu} className="overlay closed" id="overlay" />

    <PrimaryButton onClick={openMenu} classList={['menu__icon', 'white', 'small']}>
      <img className="icon" src={menu} alt="Moss Menu" />
      <img className="icon__syncing" src={menuSyncing} alt="Moss Menu" />
    </PrimaryButton>

    <div className="syncing__text">
      <p>syncing...</p>
    </div>

    <div className="menu__wrapper closed" id="menu">
      <PrimaryButton onClick={closeMenu} classList={['menu__icon__open', 'small']}>
        <img className="icon" src={menu} alt="Moss Menu" />
        <img className="icon__syncing" src={menuSyncing} alt="Moss Menu" />
      </PrimaryButton>
      <div className="menu">
        <a
          className="menu__option"
          target="_blank"
          href="https://www.notion.so/Moss-Knowledge-Base-8617fd11df824d679827182be89f7ceb"
        >
          <PrimaryButton classList={['white', 'small']}>
            📚&nbsp; Knowledge Base <span className="menu__arrow">↗</span>
          </PrimaryButton>
        </a>
        <a
          className="menu__option"
          target="_blank"
          href="https://www.notion.so/Get-in-Touch-c467ab7db72f49e5b97c0eb3374a84da"
        >
          <PrimaryButton classList={['white', 'small']}>
            💭&nbsp; Feedback <span className="menu__arrow">↗</span>
          </PrimaryButton>
        </a>
        <a className="menu__option" href="/">
          <PrimaryButton classList={['white', 'small']}>🏠&nbsp; Prototype Home</PrimaryButton>
        </a>
        <hr className="menu__rule" />
        <p className="menu__info">
          version 00.50.00
          <br />
          canvas code: {props.shortCode}
        </p>
      </div>
    </div>
  </div>
)

export default Menu
