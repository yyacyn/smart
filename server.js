const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io"); 


const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Simpan userId <-> socket.id mapping
    socket.on("joinRoom", (userId) => {
      if (!userId) return;
      socket.join(userId);
      console.log(`User ${userId} joined room`);
    });

    // Ketika kirim pesan
    socket.on("sendMessage", (msg) => {
      if (!msg?.senderId || !msg?.receiverId) return;
      console.log(`Message from ${msg.senderId} to ${msg.receiverId}`);

      // Kirim ke pengirim dan penerima
      io.to(msg.senderId).emit("newMessage", msg);
      io.to(msg.receiverId).emit("newMessage", msg);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.id);
    });
  });

  const PORT = 3000;
  server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
