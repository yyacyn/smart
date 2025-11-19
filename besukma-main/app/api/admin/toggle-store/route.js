import { getAuth } from "@clerk/nextjs/server"
import authAdmin from "@/middlewares/authAdmin";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// toggle isActive store
export async function POST(request) {
  try {
    const { userId } = getAuth(request)
    const isAdmin = await authAdmin(userId)

    if(!isAdmin){
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {storeId} = await request.json();

    if(!storeId){
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
    }

    // cari storenya
    const store = await prisma.store.findUnique({where: {id: storeId}});

    if(!store){
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    await prisma.store.update({
      where: { id: storeId },
      data: { isActive: !store.isActive }
    })

    return NextResponse.json({ message: `Store isActive has been toggled to ${!store.isActive}`})
  } catch (error) {
    console.error("Error in approve-store GET route:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}