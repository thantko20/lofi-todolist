import { databaseContext } from "@/database-provider"
import { RxTodoDoc } from "@/lib/rxdb"
import { useContext, useState, useEffect } from "react"
import { AddTodoSticky } from "./add-todo-sticky"
import { Todo } from "./todo"

const useTodos = () => {
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

export const TodosList = () => {
  const { todos } = useTodos()
  return (
    <div className="flex items-center gap-8 flex-col p-8 relative">
      <AddTodoSticky />
      <div className="w-full max-w-lg space-y-2">
        {todos.map((todo) => (
          <Todo key={todo.id} todo={todo} />
        ))}
      </div>
    </div>
  )
}
