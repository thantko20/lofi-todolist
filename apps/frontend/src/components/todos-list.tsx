import { useTodos } from "@/data"
import { AddTodoSticky } from "./add-todo-sticky"
import { Todo } from "./todo"

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
