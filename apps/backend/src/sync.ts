import { lastOfArray } from "rxdb"
import { db } from "./database"
import { z } from "zod"
import { NewTodo, Todo } from "./types"

export const pullQuerySchema = z.object({
  updated_at: z.coerce.number(),
  id: z.string(),
  limit: z.coerce.number()
})

export type PullQuerySchema = z.infer<typeof pullQuerySchema>

export const pull = async (query: PullQuerySchema) => {
  const rows = await db
    .selectFrom("todo")
    .selectAll()
    .where((eb) =>
      eb.or([
        eb("updated_at", ">", query.updated_at),
        eb.and([
          eb("updated_at", "=", query.updated_at),
          eb("id", ">", query.id)
        ])
      ])
    )
    .limit(query.limit)
    .execute()
  const newCheckpoint =
    rows.length === 0
      ? { id: query.id, updated_at: query.updated_at }
      : {
          id: lastOfArray(rows)!.id,
          updated_at: lastOfArray(rows)!.updated_at
        }

  return { documents: rows, checkpoint: newCheckpoint }
}

const numberBooleanSchema = z.literal(0).or(z.literal(1))

export const todoSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: numberBooleanSchema,
  updated_at: z.number(),
  created_at: z.number(),
  _deleted: z.boolean().transform((v) => (v ? 1 : 0))
})

export const pushBodySchema = z.array(
  z.object({
    newDocumentState: todoSchema,
    assumedMasterState: todoSchema.optional()
  })
)

export type PushBodySchema = z.infer<typeof pushBodySchema>

export const push = async (changedRows: PushBodySchema, eventId: number) => {
  const conflicts: Todo[] = []
  const event: { id: number; documents: NewTodo[]; checkpoint: any } = {
    id: eventId,
    documents: [],
    checkpoint: null
  }

  await db.transaction().execute(async (trx) => {
    for (const changedRow of changedRows) {
      const realMasterState = await trx
        .selectFrom("todo")
        .selectAll()
        .where("id", "=", changedRow.newDocumentState.id)
        .executeTakeFirst()

      if (
        (realMasterState && !changedRow.assumedMasterState) ||
        (realMasterState &&
          changedRow.assumedMasterState &&
          realMasterState.updated_at !==
            changedRow.assumedMasterState.updated_at)
      ) {
        conflicts.push(realMasterState)
      } else {
        if (!realMasterState) {
          await trx
            .insertInto("todo")
            .values({
              ...changedRow.newDocumentState,
              _deleted: 0,
              completed: 0
            })
            .execute()
        } else {
          await trx
            .updateTable("todo")
            .set(changedRow.newDocumentState)
            .where("id", "=", changedRow.newDocumentState.id)
            .returning(["id"])
            .execute()
        }
        event.documents.push(changedRow.newDocumentState)
        event.checkpoint = {
          id: changedRow.newDocumentState.id,
          updated_at: changedRow.newDocumentState.updated_at
        }
      }
    }
  })
  if (conflicts.length > 0) {
    console.log({ conflicts })
  }
  return { conflicts, event }
}
