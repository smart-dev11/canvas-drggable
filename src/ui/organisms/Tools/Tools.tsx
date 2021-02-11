import React, { SetStateAction, useState, Dispatch } from 'react'
import { PrimaryButton } from '../../atoms/'

import cursor from '../../../assets/icons/cursor.svg'
import note from '../../../assets/icons/note.svg'

import './Tools.scss'

interface Props {
  setCursor: (cursorType: string) => void
  clickMode: string
  setClickMode: Dispatch<SetStateAction<string>>
}

const Tools: React.FC<Props> = ({ setCursor, clickMode, setClickMode }) => {
  const getClasses = (buttonMode: string) => ['tool', 'small', buttonMode === clickMode ? 'tool-active' : 'white']
  return (
    <div className="tools">
      <PrimaryButton
        classList={getClasses('default')}
        onClick={() => {
          setCursor('default')
          setClickMode('default')
        }}
      >
        <img className="icon" src={cursor} alt="Pointer Tool" />
      </PrimaryButton>
      <PrimaryButton
        classList={getClasses('note')}
        onClick={() => {
          setCursor('text')
          setClickMode('note')
        }}
      >
        <img className="icon" src={note} alt="Note Tool" />
      </PrimaryButton>
    </div>
  )
}

export default Tools
