import {
  createRxDatabase,
  ReplicationPullHandlerResult,
  RxCollection,
  RxDocument,
  WithDeleted
} from "rxdb"
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie"
import { replicateRxCollection } from "rxdb/plugins/replication"
import { Subject } from "rxjs"
import client from "./rpc"

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

const typedWithDeletedRxTodo = (conflictedArray: TodoDocType[]) =>
  conflictedArray as unknown as WithDeleted<RxTodoDoc>[]

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
    { id: string; updated_at: number }
  >({
    collection: database.todos,
    replicationIdentifier: "my-http-replication",
    pull: {
      async handler(checkpointOrNull, batchSize) {
        const updatedAt = checkpointOrNull ? checkpointOrNull.updated_at : 0
        const id = checkpointOrNull ? checkpointOrNull.id : ""
        const response = await client.pull.$get({
          query: {
            id,
            updated_at: updatedAt.toString(),
            limit: batchSize.toString()
          }
        })
        const data = await response.json()
        return {
          documents: data.documents,
          checkpoint: data.checkpoint
        } as unknown as ReplicationPullHandlerResult<
          RxTodoDoc,
          { id: string; updated_at: number }
        >
      },
      stream$: stream.asObservable()
    },
    push: {
      async handler(changedRows) {
        const response = await client.push.$post({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          json: changedRows as any
        })
        const conflictedArray = await response.json()
        return typedWithDeletedRxTodo(conflictedArray)
      }
    }
  })

  return database
}
