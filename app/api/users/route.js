import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Ambil semua user dari tabel User di database kamu
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true, // pastikan kolom ini ada
        registeredAt: true, // pastikan kolom ini ada
      },
    });

    return NextResponse.json(users);
  } catch (err) {
    console.error("Gagal mengambil data user:", err);
    return NextResponse.json(
      { error: "Failed to fetch users", details: err.message },
      { status: 500 }
    );
  }
}


