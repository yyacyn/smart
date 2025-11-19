import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// get store info & store products
export async function GET(request) {
  try {
    // ambil username store dari query param
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username").toLowerCase();

    if(!username){
      return NextResponse.json({ error: "Missing username" }, { status: 400 });
    }

    // ambil store info dan produk instok dengan ratingnya juga
    const store = await prisma.store.findUnique({
      where: { username, isActive: true },
      include: {Product: {include: { rating: true }}}
    })

    if(!store){
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json({ store });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}