import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


// update status order seller
export async function POST(request) {
  try {
    const { userId } = getAuth(request)
    const storeId = await authSeller(userId);

    if(!storeId){
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, status } = await request.json();

    await prisma.order.update({
      where: { id: orderId, storeId },
      data: { status }
    })

    return NextResponse.json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

// ambil semua orderan untuk seller
export async function GET(request) {
  try {
    const { userId } = getAuth(request)
    const storeId = await authSeller(userId);

    if(!storeId){
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({ 
      where: { storeId },
      include: {user: true, address: true, orderItems: {include: {product: true}} },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}