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

    // Inisialisasi socket & join room
    useEffect(() => {
        if (!user) return;

        // Hindari socket ganda
        if (!socket) {
            socket = io("http://localhost:3000", { transports: ["websocket"] });
            console.log("🔌 Socket initialized");
        }

        // Join ke room ID user
        socket.emit("joinRoom", user.id);

        // Cleanup sebelum pasang listener baru
        socket.off("connect");
        socket.off("newMessage");

        socket.on("connect", () => {
            console.log("✅ Connected:", socket.id);
        });

        return () => {
            socket.off("connect");
            socket.off("newMessage");
            socket.disconnect();
            socket = null;
        };
    }, [user]);

    // Ambil daftar user dari API
    useEffect(() => {
        fetch("/api/users")
            .then((res) => res.json())
            .then(setUsers)
            .catch((err) => console.error("Failed to fetch users:", err));
    }, []);

    // Ambil pesan saat memilih user
    useEffect(() => {
        if (!selectedUser || !user) return;

        fetch(`/api/chat?senderId=${user.id}&receiverId=${selectedUser.id}`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setMessages(data);
                else setMessages([]);
            })
            .catch((err) => console.error("Failed to fetch messages:", err));
    }, [selectedUser, user]);

    // Listener realtime pesan baru
    useEffect(() => {
        if (!socket || !user || !selectedUser) return;

        const handleNewMessage = (msg) => {
            console.log("📩 newMessage event:", msg);

            // Hanya tampilkan kalau pesan ini relevan
            const isRelevant =
                (msg.senderId === user?.id && msg.receiverId === selectedUser?.id) ||
                (msg.senderId === selectedUser?.id && msg.receiverId === user?.id);

            if (!isRelevant) return;

            setMessages((prev) => {
                if (!Array.isArray(prev)) return [msg];
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        };

        socket.on("newMessage", handleNewMessage);

        return () => {
            socket.off("newMessage", handleNewMessage);
        };
    }, [user, selectedUser]);

    // Kirim pesan
    const sendMessage = async () => {
        if (!message.trim() || !selectedUser || !user) return;

        const payload = {
            senderId: user.id,
            receiverId: selectedUser.id,
            content: message.trim(),
        };

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const savedMessage = await res.json();

            // Validasi pesan berhasil
            if (!savedMessage?.id) return;

            // Tambah di UI (sender)
            setMessages((prev) => [...prev, savedMessage]);

            // Kirim realtime ke penerima
            socket.emit("sendMessage", savedMessage);

            // Kosongkan input
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
                                <p className="text-gray-400 text-center mt-10">
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


