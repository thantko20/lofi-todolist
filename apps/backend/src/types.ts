import { Generated, Insertable, Selectable, Updateable } from "kysely"

export interface Database {
  todo: TodoTable
}

export interface TodoTable {
  id: string
  title: string
  completed: Generated<number>
  updated_at: number
  created_at: Generated<number>
  _deleted: Generated<number>
}

export type Todo = Selectable<TodoTable>
export type NewTodo = Insertable<TodoTable>
export type TodoUpdate = Updateable<TodoTable>
