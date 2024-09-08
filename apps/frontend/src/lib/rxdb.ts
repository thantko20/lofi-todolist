import { createRxDatabase, RxCollection, RxDocument } from "rxdb"
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie"
import { replicateRxCollection } from "rxdb/plugins/replication"
import { Subject } from "rxjs"

const todoSchema = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    title: { type: "string", maxLength: 100 },
    completed: { type: "number", default: 0 },
    updated_at: { type: "number" },
    created_at: { type: "number" }
  },
  required: ["id", "title", "updated_at"]
} as const

export type TodoDocType = {
  id: string
  title: string
  completed: number
  updated_at: number
  created_at: number
}

export type RxTodoDoc = RxDocument<TodoDocType>

export type Database = { todos: RxCollection<TodoDocType> }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createRxDb(stream: Subject<any>) {
  const database = await createRxDatabase<Database>({
    name: "mydatabase",
    storage: getRxStorageDexie(),
    ignoreDuplicate: true
  })

  await database.addCollections({
    todos: {
      schema: todoSchema
    }
  })

  const _replicationState = replicateRxCollection<
    RxTodoDoc,
    { id: string; updated_at: string }
  >({
    collection: database.todos,
    replicationIdentifier: "my-http-replication",
    pull: {
      /* add settings from below */
      async handler(checkpointOrNull, batchSize) {
        const updatedAt = checkpointOrNull ? checkpointOrNull.updated_at : 0
        const id = checkpointOrNull ? checkpointOrNull.id : ""
        const response = await fetch(
          `http://localhost:3000/pull?updated_at=${updatedAt}&id=${id}&limit=${batchSize}`
        )
        const data = await response.json()
        return {
          documents: data.documents,
          checkpoint: data.checkpoint
        }
      },
      stream$: stream.asObservable()
    },
    push: {
      async handler(changedRows) {
        console.log(changedRows)
        const response = await fetch("http://localhost:3000/push", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(changedRows)
        })
        const conflictedArray = await response.json()
        return conflictedArray
      }
    }
  })

  return database
}
