import React, { useState, useContext } from 'react'
import { withRouter } from 'react-router-dom'

import { Header } from '../../ui/organisms/'
import { H1, H2, TextInput, Text, PrimaryButton } from '../../ui/atoms/'
import CurrentParticipantContext from '../../contexts/CurrentParticipantContext'
import { FirestoreContext, Timestamp, ICanvas } from '../../firebase'
import { getRandomAvatar } from '../../logic/util'
import { Firestore } from '../../types/firebase'

import './ChooseName.scss'

const ChooseName = ({ ...props }: any) => {
  const [isValidName, setIsValidName] = useState<boolean>(false)
  const [participantName, setParticipantName] = useState<string>('')
  const firestore: Firestore = useContext(FirestoreContext)
  const currentParticipant: any = useContext(CurrentParticipantContext)
  const [joiningCanvas, setJoiningCanvas] = useState<boolean>(false)
  const [joiningCanvasId, setJoiningCanvasId] = useState<undefined | string>()

  const checkValidity = (e: any) => {
    if (!e || !e.target) return
    setIsValidName(e.target.validity.valid)
    setParticipantName(e.target.value)
  }

  const createCanvas = async () => {
    if (participantName === '') {
      alert('Enter your name before creating a new Canvas')
      return
    }

    setJoiningCanvas(true)

    if (currentParticipant.wasShortCodeMadeThisSession) {
      await firestore.collection('canvases').add({
        createdAt: Timestamp.fromDate(new Date()),
        shortCode: currentParticipant.activeShortCode,
      } as ICanvas)
    }

    await joinCanvas(currentParticipant.activeShortCode)
  }

  const joinCanvas = async (activeShortCode: string) => {
    if (participantName === '') {
      alert('Enter your name before joining an existing Canvas')
      return
    }

    if (activeShortCode === '') {
      alert('Please retry generating a canvas ID')
      return
    }

    setJoiningCanvas(true)

    // NOTE: this is how you fetch a base collection
    const canvasesWithCode = await firestore
      .collection('canvases')
      .orderBy('createdAt', 'desc')
      .where('shortCode', '==', activeShortCode)
      .limit(1)
      .get()

    if (canvasesWithCode.size > 0) {
      const canvas = canvasesWithCode.docs[0]
      const canvasId = canvas.id

      const avatar = await getRandomAvatar()

      const result = await canvas.ref.collection('participants').add({
        avatar,
        name: participantName,
        createdAt: Timestamp.fromDate(new Date()),
        lastSeenAt: Timestamp.fromDate(new Date()),
      })

      currentParticipant.id = result.id
      currentParticipant.canvasId = canvasId
      currentParticipant.avatar = avatar

      setJoiningCanvasId(canvasId)
      return props.history.push(`/${canvasId}/canvas`)
    } else {
      setJoiningCanvas(false)
      alert("Couldn't find canvas")
    }
  }

  return (
    <div>
      <div>
        <div className="back">
          <PrimaryButton classList={['light']} onClick={() => props.history.goBack()}>
            back
          </PrimaryButton>
        </div>
      </div>
      <div className="landing__wrapper">
        <div className="landing__upper">
          <Header />
          <H1>One last thing.</H1>
          <H2>Your name lets others know who's on the canvas.</H2>
        </div>
        <div className="landing__center">
          <TextInput type="text" onChange={(e: any) => checkValidity(e)} placeholder="enter your name" required />
        </div>
        <div className="landing__lower">
          {isValidName && (
            <div>
              <PrimaryButton classList={['blue']} onClick={createCanvas}>
                Take me to Moss &nbsp; →
              </PrimaryButton>
            </div>
          )}
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

export default withRouter(ChooseName)
