import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { useLocalStore, observer } from 'mobx-react'
import { create as createMobxPersist } from 'mobx-persist'

import { FirestoreContext, firestore, IParticipant, Timestamp, PARTICIPANT_PRESENCE_MS } from './firebase'
import CurrentParticipantContext, { CurrentParticipantStore } from './contexts/CurrentParticipantContext'
import useAsyncEffect from './hooks/useAsyncEffect'
import useInterval from './hooks/useInterval'
import { Home, Canvas, CreateCanvas, EmailCode, Install, ChooseName } from './screens/'

const hydrate = createMobxPersist()

enum MobxHydrateState {
  None,
  Hydrating,
  Hydrated,
}

const App = observer(() => {
  const currentParticipant = useLocalStore(() => new CurrentParticipantStore())
  const [hydrateState, setHydrateState] = useState(MobxHydrateState.None)

  // on reload, we need to rehydrate the current participants state, so like he never left
  useAsyncEffect(async () => {
    if (hydrateState === MobxHydrateState.None) {
      setHydrateState(MobxHydrateState.Hydrating)
      await hydrate('currentParticipant', currentParticipant)
      setHydrateState(MobxHydrateState.Hydrated)
    }
  }, [])

  const presenceHeartbeat = () => {
    const { id, canvasId } = currentParticipant
    if (id === null && canvasId === null) return

    firestore.doc(`canvases/${canvasId}/participants/${id}`).set(
      {
        lastSeenAt: Timestamp.fromDate(new Date()),
      } as Partial<IParticipant>,
      {
        merge: true,
      },
    )
  }

  useEffect(presenceHeartbeat, [currentParticipant.id, currentParticipant.canvasId])
  useInterval(presenceHeartbeat, PARTICIPANT_PRESENCE_MS / 2)

  if (hydrateState === MobxHydrateState.Hydrated) {
    return (
      <FirestoreContext.Provider value={firestore}>
        <CurrentParticipantContext.Provider value={currentParticipant}>
          <Router>
            <Switch>
              <Route path="/" exact>
                <Home />
              </Route>
              <Route path="/install" exact>
                <Install />
              </Route>
              <Route path="/login" exact>
                <ChooseName />
              </Route>
              <Route path="/canvas/new" exact>
                <CreateCanvas />
              </Route>
              <Route path="/:canvasId/canvas" exact>
                <Canvas />
              </Route>
              <Route path="/:canvasId/email" exact>
                <EmailCode />
              </Route>
            </Switch>
          </Router>
        </CurrentParticipantContext.Provider>
      </FirestoreContext.Provider>
    )
  } else {
    return null
  }
})

export default App
