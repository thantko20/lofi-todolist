import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { createTables } from "./database"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { Socket, Server as SocketServer } from "socket.io"
import { Subject } from "rxjs"
import { pull, pullQuerySchema, push, pushBodySchema } from "./sync"
import { zValidator } from "@hono/zod-validator"
import { initSocket } from "./init-socket"

const app = new Hono<{ Variables: { socketio: Socket } }>()
let lastEventId = 0

const port = 3000
console.log(`Server is running on port ${port}`)

await createTables()
const server = serve({
  fetch: app.fetch,
  port
})
const io = initSocket(server)

app.use(cors({ origin: "*" }))
app.use(logger())

app.get("/", (c) => {
  return c.text("Hello Hono!")
})

app.get("/pull", zValidator("query", pullQuerySchema), async (c) => {
  const result = await pull(c.req.valid("query"))
  return c.json(result)
})

app.post("/push", zValidator("json", pushBodySchema), async (c) => {
  const changedRows = c.req.valid("json")
  const { event, conflicts } = await push(changedRows, lastEventId++)

  if (event.documents.length > 0) {
    console.log(event.documents)
    io.emit("pullStream", event)
  }
  return c.json(conflicts)
})
