import { toast } from 'react-toastify'
import WSC from '../WebSocketClient'
import { SetTimeout } from '../types/functions'
import { Firestore, FirebaseAddTargetMessage, AddTargetObject } from '../types/firebase'
import { IContainer } from '../types/containers'
import { IPreview } from '../types/previews'
import { addContainerInstance, getContainer, addPreviewInstance } from './firebase'
import { previewScale } from './previews'

export const add_sync_targets_instances = ({
  canvasId,
  firestore,
  newMediaIdsRef,
}: {
  canvasId: string
  firestore: Firestore
  newMediaIdsRef: React.MutableRefObject<{ [key: string]: boolean }>
}) => async (message: FirebaseAddTargetMessage) => {
  // if we get here, the backend added objects (directories, assets, containers and previews)
  const messageObjs = message.result.objects.reduce(
    (
      acc: {
        success: {
          directory?: AddTargetObject[]
          asset?: AddTargetObject[]
        }
        ambiguous: AddTargetObject[]
        error: AddTargetObject[]
      },
      obj,
    ) => {
      const { status, target_type } = obj
      if (status === 'success') {
        if (!acc[status][target_type]) {
          acc[status][target_type] = []
        }
        acc[status][target_type]?.push(obj)
      } else {
        acc[status].push(obj)
      }
      return acc
    },
    { success: {}, ambiguous: [], error: [] },
  )

  // we passed where we dropped the load through the backend messaging
  let curX = message.data.dropX
  let curY = message.data.dropY

  // add instances for containers in a vertical list
  const directories = messageObjs.success.directory
  if (directories?.length) {
    for (const directory of directories) {
      const { containerId } = directory.data as IContainer
      addContainerInstance(firestore, canvasId, containerId, curX, curY, 1)
      const container: any = await getContainer(firestore, canvasId, containerId)
      curY += container.data().height
    }
  }

  // then add instances for individual previews in a grid
  let colMaxY = [curY, curY, curY, curY]
  let rowItemCount = 0
  const asset_targets = messageObjs.success.asset
  if (asset_targets?.length) {
    for (const asset_target of asset_targets) {
      const asset = asset_target.data
      const scale = previewScale(asset)
      const { previewId, dimensions } = asset as IPreview
      addPreviewInstance(firestore, canvasId, previewId, { X: curX, Y: curY, scale })
      colMaxY[rowItemCount] += dimensions[1] * scale + 20
      rowItemCount += 1
      if (rowItemCount === 4) {
        rowItemCount = 0
        curX = message.data.dropX
      } else {
        curX += 160
      }
      curY = colMaxY[rowItemCount]
    }
  }

  const ambiguous = messageObjs.ambiguous
  if (ambiguous.length) {
    alert(
      'Warning: some items not added due to ambiguous paths\n' +
        ambiguous.map((msg: any) => {
          return `\n${msg['data']['fileName']}:\n    ${msg['data']['paths'].join('\n    ')}`
        }),
    )
  }

  const errors = messageObjs.error
  if (errors.length) {
    // @TODO These error obj types can be defined
    const not_found = errors.filter((obj: any) => obj.error_type === 'not_found')
    if (not_found.length)
      toast.warning(
        'Some files and directories could not be found.\nThis is likely due to Spotlight not knowing about them.\n' +
          'Please make sure you have given full disk access permission to Moss\n' +
          'I am having trouble locating the following:\n' +
          not_found.map((msg: any) => {
            return `\n${msg['target']['fileName']}:\n`
          }),
        {
          position: 'top-center',
          autoClose: false,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        },
      )

    const other_errors = errors.filter((obj: any) => obj.error_type !== 'not_found')
    if (other_errors.length)
      toast.warning(
        'An error was encountered when adding the following files.\n' +
          'Please try again and contact support if the problem persists:\n\n' +
          other_errors.map((msg: any) => {
            return `\n${msg['target']['fileName']}:\n`
          }),
        {
          position: 'top-center',
          autoClose: false,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        },
      )
  }
}

export const onMessage = ({
  setIsLoading,
  add_sync_targets_instances,
  setDaemonId,
}: {
  setIsLoading: (isLoading: boolean) => void
  add_sync_targets_instances: (message: any) => void
  setDaemonId: (message: any) => void
}) => (evt: MessageEvent) => {
  const message = JSON.parse(evt.data)

  const action = message.action
  const status = message.status

  if (status === 'error') {
    console.warn('ERROR: received error from backend: ' + JSON.stringify(message, null, 4))
    if (!process.env.DONT_SHOW_DEBUG_ERRORS) {
      const msg = 'ERROR: received error from backend:\n\n' + message['error']
      toast.error(msg, {
        position: 'top-center',
        autoClose: false,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
      // TODO: this needs work to break on newlines in the toast
      // let msg = 'ERROR: received error from backend:\n\n' + message['error']
      // let foo = msg.split('\n')
      // msg = msg.replace(/\n/g, '<br />')
      // toast.error(
      //   <div>{foo.map((line) => {
      //     return (<br />${line})}
      //   )}
      //     </div>
      // )
    }
  } else if (action === 'add_sync_targets') {
    setIsLoading(false)
    add_sync_targets_instances(message)
  } else if (action === 'get_daemonId') {
    setDaemonId(message['daemonId'])
  } else if (action === 'link_asset_preview') {
    // nothing to do here?
  } else if (action === 'link_directory_container') {
    // nothing to do here?
  } else if (action === 'open_in_finder') {
    // nothing to do here?
  } else if (action === 'open_in_app') {
    // nothing to do here?
  } else {
    console.warn('ERROR: unhandled response from backend: ' + JSON.stringify(message, null, 4))
  }
}

export const onOpen = ({
  setConnectedToServer,
  reconnectTimerRef,
  setReconnectTimer,
  dropAttemptedRef,
  setDropAttempted,
}: {
  setConnectedToServer: (isConnected: boolean) => void
  reconnectTimerRef: React.RefObject<SetTimeout>
  setReconnectTimer: (timer: SetTimeout | null) => void
  dropAttemptedRef: React.RefObject<boolean>
  setDropAttempted: (dropAttempted: boolean) => void
}) => (evt: Event) => {
  setConnectedToServer(true)

  // if we have been trying to reconnect, shut the timer
  if (reconnectTimerRef.current) {
    clearTimeout(reconnectTimerRef.current)
    setReconnectTimer(null)
  }

  // if tried to take action while disconnected, show the user a message
  if (dropAttemptedRef.current) {
    setDropAttempted(false)
    alert('You have successfully reconnected to the server, feel free to add and edit files to the canvas')
  }

  // when initially connecting, get our daemonId for identifying what we own
  const getDaemonIdMessage = {
    action: 'get_daemonId',
  }
  WSC.send(JSON.stringify(getDaemonIdMessage))
}

export const onClose = ({
  setConnectedToServer,
  setReconnectTimer,
}: {
  setConnectedToServer: (isConnected: boolean) => void
  setReconnectTimer: (timer: SetTimeout | null) => void
}) => (evt: CloseEvent) => {
  setConnectedToServer(false)
  setReconnectTimer(
    setTimeout(() => {
      WSC.connect()
    }, 2000),
  )
}

export function onError(evt: Event) {
  console.warn('error: ' + evt + '\n' + JSON.stringify(evt))

  WSC.disconnect()
}
