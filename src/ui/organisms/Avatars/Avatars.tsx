import React, { memo } from 'react'
import { useParams } from 'react-router-dom'
import { WithId, IParticipant } from '../../../firebase'

import { usePresentParticipantsData, useFindOrCreateAnonymousParticipant } from '../../../hooks/participants'

import './Avatars.scss'

interface AvatarListProps {
  participants: WithId<IParticipant>[] | null
}

const AvatarList: React.FC<AvatarListProps> = memo(
  ({ participants }) => (
    <ul className="avatars">
      {participants?.map(({ name, id, avatar }) =>
        avatar ? (
          <li className="avatar" key={id}>
            <img src={avatar} alt="Avatar" />
            <p className="tip">{name}</p>
          </li>
        ) : null,
      )}
    </ul>
  ),
  (prevProps, nextProps) => prevProps.participants?.length === nextProps.participants?.length,
)

const Avatars: React.FC = () => {
  const { canvasId } = useParams<{ canvasId: string }>()
  const participants = usePresentParticipantsData(canvasId)

  useFindOrCreateAnonymousParticipant(participants, canvasId)

  return <AvatarList participants={participants} />
}

export default Avatars
