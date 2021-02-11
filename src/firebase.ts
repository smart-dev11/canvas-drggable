import { createContext } from 'react'
import * as firebase from 'firebase/app'
import 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
}

const firebaseApp = firebase.initializeApp(firebaseConfig)
const firestore = firebase.firestore(firebaseApp)

export const Timestamp = firebase.firestore.Timestamp

const FirestoreContext = createContext(firestore)

export { firebaseApp, firestore, FirestoreContext }

export type WithId<T> = T & { id: string }

export interface ICanvas {
  createdAt: firebase.firestore.Timestamp
  shortCode: string
}

// if no connection for 15 Minutes, participant times out
export const PARTICIPANT_PRESENCE_MS = 900000
export interface IParticipant {
  createdAt: firebase.firestore.Timestamp
  lastSeenAt: firebase.firestore.Timestamp
  daemonId: string
  name: string
  avatar: string
}
