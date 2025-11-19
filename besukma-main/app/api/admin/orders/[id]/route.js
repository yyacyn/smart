import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import authAdmin from "@/middlewares/authAdmin";

// GET /api/admin/orders/[id] -> return single order for admin users
export async function GET(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const awaitedId = await params;
    const  id  = awaitedId.id;
    if (!id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: { include: { product: true } },
        address: true,
        user: true,
        store: true,
        statusHistory: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("GET admin/orders/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch order" }, { status: 500 });
  }
}
