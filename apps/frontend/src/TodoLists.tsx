import { useEffect, useMemo, useState } from "react"
import TodoList from "./model/todo-list"
import { database } from "./model"
import { Q } from "@nozbe/watermelondb"
import { Clause } from "@nozbe/watermelondb/QueryDescription"

const useTodoLists = () => {
  const [todoLists, setTodoLists] = useState<TodoList[]>([])

  const listsQuery = useMemo(() => {
    const query = database.get<TodoList>(TodoList.table).query()
    const clauses: Clause[] = []
    clauses.push(Q.sortBy("title", "asc"))

    return query.extend(clauses)
  }, [])

  useEffect(() => {
    const subscription = listsQuery.observe().subscribe(setTodoLists)
    return () => subscription.unsubscribe()
  }, [listsQuery])
  return { todoLists }
}

export function TodoLists() {
  const { todoLists } = useTodoLists()
  return todoLists.map((list) => (
    <div key={list.id}>
      <span>{list.title}</span>
      <button
        onClick={async () => {
          await database.write(async () => {
            await list.destroyPermanently()
          })
        }}
      >
        Delete
      </button>
    </div>
  ))
}
