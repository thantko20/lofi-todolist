import { databaseContext } from "@/database-provider"
import { generateId } from "@/lib/utils"
import { ElementRef, useContext, useRef } from "react"
import { Input } from "./ui/input"
import { EnterIcon } from "@radix-ui/react-icons"
import { Button } from "./ui/button"

export const AddTodoSticky = () => {
  const titleRef = useRef<ElementRef<"input">>(null)
  const db = useContext(databaseContext)!
  return (
    <form
      className="z-50 w-full p-2 max-w-lg flex gap-4 sticky top-0 bg-white/50 backdrop-blur-sm rounded"
      onSubmit={async (e) => {
        e.preventDefault()
        if (titleRef.current?.value) {
          await db.todos.insert({
            id: generateId(),
            title: titleRef.current!.value,
            completed: 0,
            updated_at: Date.now(),
            created_at: Date.now()
          })

          titleRef.current.value = ""
        }
      }}
    >
      <Input ref={titleRef} type="text" placeholder="Todo title" name="title" />
      <Button type="submit" size="sm">
        Submit <EnterIcon className="ml-2" />
      </Button>
    </form>
  )
}
