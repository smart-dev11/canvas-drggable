import { useEffect, useContext } from 'react'
import WSC from '../WebSocketClient'
import { onOpen, onClose, onMessage, onError, add_sync_targets_instances } from '../logic/webSocket'
import { FirestoreContext } from '../firebase'
import { SetTimeout } from '../types/functions'

export const useWebsocketSetup = ({
  setIsLoading,
  setDaemonId,
  setConnectedToServer,
  reconnectTimerRef,
  setReconnectTimer,
  dropAttemptedRef,
  setDropAttempted,
  canvasId,
  newMediaIdsRef,
}: {
  setIsLoading: (isLoading: boolean) => void
  setDaemonId: (message: any) => void
  setConnectedToServer: (isConnected: boolean) => void
  reconnectTimerRef: React.RefObject<SetTimeout>
  setReconnectTimer: (timer: SetTimeout | null) => void
  dropAttemptedRef: React.RefObject<boolean>
  setDropAttempted: (dropAttempted: boolean) => void
  canvasId: string
  newMediaIdsRef: React.MutableRefObject<{ [key: string]: boolean }>
}) => {
  const firestore = useContext(FirestoreContext)
  useEffect(() => {
    WSC.setCallbacks({
      onopen: onOpen({
        setConnectedToServer,
        reconnectTimerRef,
        setReconnectTimer,
        dropAttemptedRef,
        setDropAttempted,
      }),
      onclose: onClose({ setConnectedToServer, setReconnectTimer }),
      onmessage: onMessage({
        setIsLoading,
        add_sync_targets_instances: add_sync_targets_instances({
          canvasId,
          firestore,
          newMediaIdsRef,
        }),
        setDaemonId,
      }),
      onerror: onError,
    })
    WSC.connect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
