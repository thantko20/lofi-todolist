import { type AppType } from "@lofi-todolist/backend"
import { hc } from "hono/client"

const client = hc<AppType>("http://localhost:3000")

export default client
