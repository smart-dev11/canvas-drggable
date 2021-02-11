import React, { useState, useContext } from 'react'
import { Link, withRouter } from 'react-router-dom'

import { Header } from '../../ui/organisms/'
import { H1, H2, TextInput, Text, PrimaryButton } from '../../ui/atoms/'
import { randomAlpha } from '../../logic/util'
import CurrentParticipantContext from '../../contexts/CurrentParticipantContext'

import './CreateCanvas.scss'

const newShortCode = randomAlpha(6).toUpperCase()

const CreateCanvas = ({ ...props }: any) => {
  const [copySuccess, setCopySuccess] = useState<boolean>(false)
  const currentParticipant = useContext(CurrentParticipantContext)

  const copyToClipBoard = async () => {
    try {
      await navigator.clipboard.writeText(newShortCode)
      setCopySuccess(true)
    } catch (err) {
      setCopySuccess(false)
    }
  }

  const addShortCodeToGlobalStore = () => {
    currentParticipant.activeShortCode = newShortCode
    currentParticipant.wasShortCodeMadeThisSession = true
    return props.history.push('/install')
  }

  return (
    <div>
      <div>
        <Link className="back" to="/">
          <PrimaryButton classList={['light']}>back</PrimaryButton>
        </Link>
      </div>
      <div className="landing__wrapper">
        <div className="landing__upper">
          <Header />
          <H1>You've created a new canvas.</H1>
          <H2>This canvas code is how you access your workspace. Share it with teammates to start collaborating.</H2>
        </div>
        <div className="landing__center">
          <TextInput value={newShortCode} disabled />
          <Text onClick={copyToClipBoard}>
            <span className="link">{copySuccess ? 'copied!' : 'copy this code'}</span>
          </Text>
          {/* Add back in when the email works
          <Link to={`/${newShortCode}/email`}>
            <span className="link">email me this code</span>
          </Link>
          */}
        </div>
        <div className="landing__lower">
          <PrimaryButton onClick={addShortCodeToGlobalStore}>continue &nbsp; →</PrimaryButton>
          <Text>
            New to Moss? Head over to the&nbsp;
            <a target="_blank" href="https://www.notion.so/Moss-Knowledge-Base-8617fd11df824d679827182be89f7ceb">
              <span>
                <u>Knowledge Base</u>
              </span>
            </a>
            &nbsp;📚
          </Text>
        </div>
      </div>
    </div>
  )
}

export default withRouter(CreateCanvas)
