import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(" New client connected:", socket.id);

    // ketika user join room (id user)
    socket.on("joinRoom", (userId) => {
      if (!userId) return;
      socket.join(userId);
      console.log(`👤 User ${userId} joined their room`);
    });

    // kirim pesan realtime
    socket.on("sendMessage", (data) => {
      console.log("📤 Message received:", data);
      // kirim ke penerima
      io.to(data.receiverId).emit("newMessage", data);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Disconnected:", socket.id);
    });
  });

  const PORT = 3000;
  server.listen(PORT, () =>
    console.log(`🚀 Server ready on http://localhost:${PORT}`)
  );
});
