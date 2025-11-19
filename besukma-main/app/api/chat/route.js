
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const senderId = searchParams.get("senderId");
    const receiverId = searchParams.get("receiverId");

    if (!receiverId || !senderId) {
      console.warn("Missing senderId or receiverId in query");
      return NextResponse.json([], { status: 200 }); // kirim array kosong
    }

    console.log("Fetching messages between:", senderId, "and", receiverId);

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (err) {
    console.error("Failed to fetch messages:", err);
    return NextResponse.json(
      { error: "Failed to fetch messages", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { senderId, receiverId, content } = await req.json();

    if (!senderId || !receiverId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: { senderId, receiverId, content },
    });

    console.log("Message sent:", content);
    return NextResponse.json(message);
  } catch (err) {
    console.error("Failed to send message:", err);
    return NextResponse.json(
      { error: "Failed to send message", details: err.message },
      { status: 500 }
    );
  }
}

