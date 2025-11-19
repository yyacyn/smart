import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import authAdmin from "@/middlewares/authAdmin";

// GET /api/admin/orders -> return all orders for admin users
export async function GET(request) {
  try {
    const { userId } = getAuth(request)
    const isAdmin = await authAdmin(userId)
    if(!isAdmin){
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else{
    const orders = await prisma.order.findMany({
        include: {
            orderItems: { include: { product: true } },
            address: true,
            user: true,
            store: true,
        },
        orderBy: { createdAt: 'desc' }
        });
    return NextResponse.json({ orders });
    }

    
  } catch (error) {
    console.error("GET admin/orders error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch orders" }, { status: 500 });
  }
}
