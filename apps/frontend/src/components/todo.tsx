import {
  Cross2Icon,
  CheckIcon,
  TrashIcon,
  Pencil1Icon
} from "@radix-ui/react-icons"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { RxTodoDoc } from "../lib/rxdb"
import { useRef, useState } from "react"
import { Input } from "./ui/input"
import { flushSync } from "react-dom"
import { cn, fromNow } from "@/lib/utils"
import { Switch } from "./ui/switch"

export function Todo({ todo }: { todo: RxTodoDoc }) {
  const [editTitle, setEditTitle] = useState(todo.title)
  const [mode, setMode] = useState<"view" | "edit">("view")
  const inputRef = useRef<HTMLInputElement>(null)

  const discard = () => {
    setMode("view")
    setEditTitle(todo.title)
  }

  const onClickEdit = () => {
    flushSync(() => {
      setMode("edit")
    })
    if (inputRef.current) {
      inputRef.current.select()
    }
  }

  return (
    <Card className="flex items-center gap-4">
      <CardContent className="p-4 flex justify-between items-start w-full gap-4 h-24">
        {mode === "view" ? (
          <div key={todo.id} className="h-full flex flex-col">
            <div
              className={cn(
                "text-lg font-semibold truncate max-w-[300px]",
                todo.completed ? "line-through text-muted-foreground" : ""
              )}
              aria-disabled={!!todo.completed}
              onClick={() => {
                if (!todo.completed) {
                  onClickEdit()
                }
              }}
              title={todo.title}
            >
              {todo.title}
            </div>
            <div className="text-sm text-gray-600 mt-auto">
              {fromNow(todo.updated_at)}
            </div>
          </div>
        ) : (
          <form
            id="edit-todo-title"
            onSubmit={async (e) => {
              e.preventDefault()
              if (editTitle.trim()) {
                await todo.patch({ title: editTitle, updated_at: Date.now() })
                setMode("view")
              }
            }}
          >
            <Input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.currentTarget.value)}
              className={"h-8 text-sm"}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  discard()
                }
              }}
            />
          </form>
        )}
        <div className="flex gap-1 items-center">
          {mode === "view" ? (
            <>
              <Switch
                checked={!!todo.completed}
                onCheckedChange={async (checked) => {
                  await todo.patch({
                    completed: checked ? 1 : 0
                  })
                }}
              />
              <Button
                variant="default"
                aria-label="edit todo"
                size="icon"
                onClick={onClickEdit}
                disabled={!!todo.completed}
              >
                <Pencil1Icon className="w-4 h-4" />
              </Button>
              <Button
                onClick={todo.remove}
                size={"icon"}
                variant={"destructive-ghost"}
                aria-label="delete todo"
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </>
          ) : null}
          {mode === "edit" ? (
            <>
              <Button
                type="submit"
                form="edit-todo-title"
                className="bg-green-600 hover:bg-green-500"
                aria-label="save todo"
                size="icon"
              >
                <CheckIcon className="w-4 h-4" />
              </Button>
              <Button
                onClick={discard}
                variant={"destructive-ghost"}
                size="icon"
              >
                <Cross2Icon className="w-4 h-4" />
              </Button>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
