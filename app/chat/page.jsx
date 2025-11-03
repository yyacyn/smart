"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import io from "socket.io-client";

let socket;

export default function ChatPage() {
    const { user } = useUser();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");

    // 🔌 Inisialisasi socket dan join ke room user
    useEffect(() => {
        if (!user) return;

        if (!socket) {
            socket = io("http://localhost:3000", { transports: ["websocket"] });
            console.log("🔌 Socket initialized");
        }

        // join room user
        socket.emit("joinRoom", user.id);

        // Hapus semua listener dulu agar gak dobel
        socket.off("newMessage");
        socket.off("connect");

        socket.on("connect", () => {
            console.log("Connected:", socket.id);
        });

        socket.on("newMessage", (msg) => {
            console.log("newMessage event received:", msg);
            setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev; // hindari duplikat
                return [...prev, msg];
            });
        });

        return () => {
            socket.off("newMessage");
            socket.off("connect");
            socket.disconnect();
        };
    }, [user]);

    // 🔹 Ambil daftar user dari API Clerk
    useEffect(() => {
        fetch("/api/users")
            .then((res) => res.json())
            .then(setUsers)
            .catch((err) => console.error("Failed to fetch users:", err));
    }, []);

    // 🔹 Ambil pesan saat memilih user
    useEffect(() => {
        if (!selectedUser || !user) return;
        fetch(`/api/chat?senderId=${user.id}&receiverId=${selectedUser.id}`)
            .then((res) => res.json())
            .then(setMessages);
    }, [selectedUser, user]);

    // Kirim pesan
    const sendMessage = async () => {
        if (!message || !selectedUser || !user) return;

        const payload = {
            senderId: user.id,
            receiverId: selectedUser.id,
            content: message,
        };

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const savedMessage = await res.json();

            // tampilkan di UI sender
            setMessages((prev) => [...prev, savedMessage]);

            // kirim realtime ke penerima
            socket.emit("sendMessage", savedMessage);

            setMessage("");
        } catch (err) {
            console.error("Failed to send message:", err);
        }
    };
    return (
        <div className="flex h-screen">
            {/* Sidebar daftar user */}
            <div className="w-1/3 border-r p-4 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Users</h2>
                {users.map((u) => (
                    <div
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer ${selectedUser?.id === u.id
                            ? "bg-blue-100"
                            : "hover:bg-gray-100"
                            }`}
                    >
                        <img
                            src={u.image || "/default-avatar.png"}
                            alt={u.name}
                            className="w-8 h-8 rounded-full"
                        />
                        <div>
                            <p className="font-medium">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedUser ? (
                    <>
                        <div className="p-4 border-b">
                            <h3 className="text-lg font-semibold">
                                Chat with {selectedUser.name}
                            </h3>
                        </div>

                        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                            {Array.isArray(messages) && messages.length > 0 ? (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`p-2 my-1 rounded max-w-[60%] ${msg.senderId === user?.id
                                            ? "bg-blue-200 text-right ml-auto"
                                            : "bg-gray-200"
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400">
                                    No messages yet
                                </p>
                            )}
                        </div>

                        <div className="p-4 flex gap-2 border-t">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="border p-2 rounded flex-1"
                            />
                            <button
                                onClick={sendMessage}
                                className="bg-blue-500 text-white px-4 py-2 rounded"
                            >
                                Send
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Select a user to start chatting
                    </div>
                )}
            </div>
        </div>
    );
}


