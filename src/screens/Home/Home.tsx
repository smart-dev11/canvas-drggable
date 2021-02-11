import React, { useState, useContext, Fragment } from 'react'
import { Link, withRouter } from 'react-router-dom'

import { Header } from '../../ui/organisms/'
import { H1, H2, TextInput, Text, PrimaryButton } from '../../ui/atoms/'
import CurrentParticipantContext from '../../contexts/CurrentParticipantContext'
import { FirestoreContext } from '../../firebase'

import './Home.scss'

const Home = ({ ...props }: any) => {
  const [canvasCode, setCanvasCode]: any = useState<string>('')
  const [isValidShortCode, setIsValidShortCode] = useState<undefined | boolean>()
  const firestore = useContext(FirestoreContext)
  const currentParticipant = useContext(CurrentParticipantContext)

  const joinCanvasEvent = async () => {
    joinCanvas(canvasCode)
  }

  const joinCanvas = async (activeShortCode: string) => {
    if (activeShortCode?.length !== 6) {
      alert('Enter an existing Canvas code to join')
      return
    }

    const canvasesWithCode = await firestore
      .collection('canvases')
      .orderBy('createdAt', 'desc')
      .where('shortCode', '==', activeShortCode)
      .limit(1)
      .get()

    if (canvasesWithCode?.size > 0) {
      currentParticipant.activeShortCode = activeShortCode
      setIsValidShortCode(true)
    } else {
      alert("Couldn't find canvas")
    }
  }
  if (isValidShortCode) {
    setIsValidShortCode(false)
    return props.history.push('/login')
  }

  return (
    <div>
      <div className="landing__wrapper">
        <div className="landing__upper">
          <Header />
          <H1>Welcome to the Moss prototype</H1>
          <H2>We're glad you're here.</H2>
        </div>
        <div className="landing__center">
          <TextInput
            placeholder="enter your canvas code"
            onChange={(e: any) => setCanvasCode(e.target.value)}
            value={canvasCode}
          />
          <Text>
            or{' '}
            <Link to="/canvas/new">
              <span>
                <u>create a new canvas</u>
              </span>
            </Link>
          </Text>
        </div>
        <div className="landing__lower">
          <Text>
            <div>
              <PrimaryButton onClick={() => joinCanvasEvent()}>continue &nbsp; →</PrimaryButton>
            </div>
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

export default withRouter(Home)
