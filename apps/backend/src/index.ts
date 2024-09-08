import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { createTables } from "./database"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { Socket } from "socket.io"
import { pull, pullQuerySchema, push, pushBodySchema } from "./sync"
import { zValidator } from "@hono/zod-validator"
import { initSocket } from "./init-socket"
import { Subject } from "rxjs"

const pullStream$ = new Subject<any>()

const syncRoutes = new Hono()
  .get("/", (c) => c.text("Hello Hono!"))
  .get("/pull", zValidator("query", pullQuerySchema), async (c) => {
    const result = await pull(c.req.valid("query"))
    return c.json(result)
  })
  .post("/push", zValidator("json", pushBodySchema), async (c) => {
    const changedRows = c.req.valid("json")
    const { event, conflicts } = await push(changedRows, lastEventId++)

    if (event.documents.length > 0) {
      pullStream$.next(event)
    }
    return c.json(conflicts)
  })

const app = new Hono<{ Variables: { socketio: Socket } }>().route(
  "/",
  syncRoutes
)
let lastEventId = 0

const port = 3000

await createTables()
const server = serve({
  fetch: app.fetch,
  port
})

console.log(`Server is running on port ${port}`)
const io = initSocket(server)

pullStream$.subscribe((event) => io.emit("pullStream", event))

app.use(cors({ origin: "*" }))
app.use(logger())

export type AppType = typeof app
