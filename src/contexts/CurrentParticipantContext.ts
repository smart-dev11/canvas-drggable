import { createContext } from 'react'
import { observable } from 'mobx'
import { persist } from 'mobx-persist'

class CurrentParticipantStore {
  @persist
  @observable
  id: string | null = null
  @persist
  @observable
  canvasId: string | null = null
  @persist
  @observable
  activeShortCode: string = ''
  @persist
  @observable
  avatar: string | null = null
  @persist
  @observable
  wasShortCodeMadeThisSession: boolean = false
}

const CurrentParticipantContext = createContext(new CurrentParticipantStore())

export { CurrentParticipantStore }
export default CurrentParticipantContext
