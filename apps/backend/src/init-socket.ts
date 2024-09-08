import { ServerType } from "@hono/node-server"
import { Server as SocketServer } from "socket.io"

export const initSocket = (server: ServerType) => {
  const io = new SocketServer(server, {
    path: "/ws",
    cors: {
      origin: "*"
    }
  })
  io.on("connection", (socket) => {
    console.log("a user connected", socket.id)
    socket.on("disconnect", () => {
      console.log("user disconnected", socket.id)
    })
  })
  io.on("error", console.log)
  return io
}
