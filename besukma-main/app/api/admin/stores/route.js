import { getAuth } from "@clerk/nextjs/server"
import authAdmin from "@/middlewares/authAdmin";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ambil semua approved store
export async function GET(request) {
  try {
    const { userId } = getAuth(request)
    const isAdmin = await authAdmin(userId)

    if(!isAdmin){
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stores = await prisma.store.findMany({
      where: {status: 'approved' },
      include: { user: true }
    })

    return NextResponse.json({ stores });
  } catch (error) {
    console.error("Error in approve-store GET route:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}