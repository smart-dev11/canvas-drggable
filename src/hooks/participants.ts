import { useObservable } from 'rxjs-hooks'
import { collectionData } from 'rxfire/firestore'
import { useContext, useEffect, useRef } from 'react'
import { map, withLatestFrom } from 'rxjs/operators'
import { subMilliseconds, isAfter } from 'date-fns'
import { WithId, IParticipant, FirestoreContext, PARTICIPANT_PRESENCE_MS, Timestamp } from '../firebase'
import { timer } from 'rxjs'
import CurrentParticipantContext from '../contexts/CurrentParticipantContext'
import { getRandomAvatar } from '../logic/util'

export const useFindOrCreateAnonymousParticipant = (participants: WithId<IParticipant>[] | null, canvasId: string) => {
  const firestore = useContext(FirestoreContext)
  const currentParticipant = useContext(CurrentParticipantContext)
  const initializedRef = useRef<boolean>(false)
  const participantsLoaded = !!participants
  return useEffect(() => {
    const { id } = currentParticipant
    if (participants && id && !initializedRef.current) {
      const findOrCreateAnonymousParticipant = async () => {
        // Search participant list for a participant whose id matches the current user
        const currentUserIdx = participants.findIndex(p => p.id === id)

        // If no matching participant is found, add a new anonymous participant
        if (currentUserIdx === -1) {
          const avatar = await getRandomAvatar()
          const result = await firestore
            .doc(`canvases/${canvasId}`)
            .collection('participants')
            .add({
              avatar,
              name: 'Anonymous',
              createdAt: Timestamp.fromDate(new Date()),
              lastSeenAt: Timestamp.fromDate(new Date()),
            })
          initializedRef.current = true

          // Update the current participant with the newly registered anonymous participant's id
          currentParticipant.id = result.id
        }
      }
      findOrCreateAnonymousParticipant()
    }
  }, [participantsLoaded, currentParticipant.id])
}

export function useParticipantsData(canvasId: string) {
  const firestore = useContext(FirestoreContext)

  return useObservable(() =>
    collectionData<WithId<IParticipant>>(firestore.doc(`canvases/${canvasId}`).collection('participants'), 'id'),
  )
}

const filterRecentlySeen = (participants: WithId<IParticipant>[]) => {
  return participants.filter(p => {
    return isAfter(p.lastSeenAt.toDate(), subMilliseconds(new Date(), PARTICIPANT_PRESENCE_MS))
  })
}

const takeLatestFromDataSource = (v: [number, WithId<IParticipant>[]]) => v[1]

export function usePresentParticipantsData(canvasId: string) {
  const firestore = useContext(FirestoreContext)

  return useObservable(() => {
    const dataSource = collectionData<WithId<IParticipant>>(
      firestore.doc(`canvases/${canvasId}`).collection('participants'),
      'id',
    )

    const replayer = timer(0, 1000).pipe(withLatestFrom(dataSource), map(takeLatestFromDataSource))

    return replayer.pipe(map(filterRecentlySeen))
  })
}
