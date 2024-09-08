import SQLite from "better-sqlite3"
import { Kysely, SqliteDialect } from "kysely"
import { Database } from "./types"

const dialect = new SqliteDialect({
  database: new SQLite("./data.db")
})

export const db = new Kysely<Database>({ dialect })

export async function createTables() {
  await db.transaction().execute(async (trx) => {
    await trx.schema
      .createTable("todo")
      .ifNotExists()
      .addColumn("id", "text", (col) => col.primaryKey().notNull())
      .addColumn("title", "text", (col) => col.notNull().defaultTo(""))
      .addColumn("description", "text", (col) => col.notNull().defaultTo(""))
      .addColumn("completed", "int2", (col) => col.notNull().defaultTo(0))
      .addColumn("updated_at", "integer", (col) => col.notNull())
      .addColumn("created_at", "integer", (col) =>
        col.notNull().defaultTo(Date.now())
      )
      .addColumn("_deleted", "int2", (col) => col.notNull().defaultTo(0))
      .execute()

    await trx.schema
      .createIndex("todo_title_idx")
      .ifNotExists()
      .on("todo")
      .column("title")
      .execute()
  })
  console.log("created tables")
}
