import React, { useState } from 'react'
import { Link, withRouter } from 'react-router-dom'

import { Header } from '../../ui/organisms/'
import { H1, H2, Text, PrimaryButton } from '../../ui/atoms/'

import './Install.scss'
import icon from '../../assets/icons/package.png'

const Install = ({ ...props }: any) => {
  const [didDownload, setDidDownload] = useState(false)

  const downloadDaemon = () => {
    const anchor = document.createElement('a')
    anchor.href = '/Moss.pkg'
    anchor.target = '_blank'
    anchor.download = 'moss.pkg'
    anchor.click()
    setDidDownload(true)
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
          <H1>Install the Moss File Syncer</H1>
          <H2>
            The desktop app allow you to sync your files & folders to Moss, so we can keep everything up to date while
            you work.
          </H2>
        </div>
        <div className="landing__center">
          <img src={icon} alt="package icon" className="download-photo" />
          <PrimaryButton onClick={downloadDaemon}>&nbsp; Download for Mac</PrimaryButton>
        </div>

        <div className="landing__lower">
          <div>
            <Link to={'/login'}>
              {didDownload ? (
                <PrimaryButton>continue &nbsp; →</PrimaryButton>
              ) : (
                <PrimaryButton classList={['light']}>skip for now &nbsp; →</PrimaryButton>
              )}
            </Link>
          </div>
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

export default withRouter(Install)
