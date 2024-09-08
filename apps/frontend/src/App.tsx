import { DatabaseProvider } from "./database-provider"
import { TodosList } from "./components/todos-list"
import { useEffect, useState } from "react"
import { createRxDb, Database } from "./lib/rxdb"
import { io } from "socket.io-client"
import { Subject } from "rxjs"

const socket = io("ws://localhost:3000", {
  path: "/ws"
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pullStream = new Subject<any>()

export default function App() {
  const [db, setDb] = useState<Database | null>(null)

  useEffect(() => {
    socket.connect()
    return () => {
      socket.close()
    }
  }, [])

  useEffect(() => {
    const onConnect = () => {
      console.log("connected")
    }
    const onConnectError = (error: unknown) => {
      console.log(error)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onPullStream = (event: Subject<any>) => {
      pullStream.next(event)
    }
    socket.on("connect", onConnect)
    socket.on("pullStream", onPullStream)
    socket.on("connect_error", onConnectError)

    return () => {
      socket.off("connect", onConnect)
      socket.off("pullStream", onPullStream)
      socket.off("connect_error", onConnectError)
    }
  }, [])

  useEffect(() => {
    createRxDb(pullStream).then(setDb)
  }, [])

  return db ? (
    <DatabaseProvider db={db}>
      <TodosList />
    </DatabaseProvider>
  ) : (
    "Loading"
  )
}
