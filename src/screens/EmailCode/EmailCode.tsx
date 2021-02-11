import React, { useState } from 'react'
import { Link } from 'react-router-dom'

import { Header } from '../../ui/organisms/'
import { H1, TextInput, Text, PrimaryButton } from '../../ui/atoms/'

import './EmailCode.scss'

const EMAIL_REGEX = `^[^ ]+@[^ ]+\.[a-z]{2,6}$`

const EmailCode = ({ ...props }: any) => {
  const [isValidEmail, setIsValidEmail] = useState(false)

  const checkValidity = (e: any) => {
    if (!e || !e.target) return
    setIsValidEmail(e.target.validity.valid)
  }

  return (
    <div>
      <div>
        <Link className="back" to="/canvas/new">
          <PrimaryButton classList={['light']}>back</PrimaryButton>
        </Link>
      </div>
      <div className="landing__wrapper">
        <div className="landing__upper">
          <Header />
          <H1>We'll send you your canvas code</H1>
        </div>
        <div className="landing__center">
          <TextInput
            type="email"
            pattern={EMAIL_REGEX}
            onChange={(e: any) => checkValidity(e)}
            placeholder="enter your email"
            required
          />
        </div>
        <div className="landing__lower">
          {isValidEmail && (
            <div>
              <Link to={`/install`}>
                <PrimaryButton>continue &nbsp; →</PrimaryButton>
              </Link>
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

export default EmailCode
