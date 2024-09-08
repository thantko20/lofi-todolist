import { useContext, useEffect, useState } from "react"
import { databaseContext } from "./database-provider"
import { RxTodoDoc } from "./lib/rxdb"

export const useTodos = () => {
  const db = useContext(databaseContext)!
  const [todos, setTodos] = useState<RxTodoDoc[]>([])

  useEffect(() => {
    const observable = db.todos.find({
      sort: [{ created_at: "desc" }, { completed: "desc" }]
    }).$
    const subscription = observable.subscribe((result) => setTodos(result))
    return () => subscription.unsubscribe()
  }, [db])

  return { todos }
}
