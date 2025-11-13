import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server"

// GET /api/admin/orders/[id] -> return single order for admin users
export async function GET(request, { params }) {
  try {
    const { userId } = getAuth(request);

    const awaitedId = await params;
    const  id  = awaitedId.id;
    if (!id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
    where: { id, userId, OR: [
        { paymentMethod: PaymentMethod.COD },
        { paymentMethod: PaymentMethod.BANK_TRANSFER }
      ] },
      include: {
        orderItems: { include: { product: true } },
        address: true,
        user: true,
        store: true,
      },
      orderBy: { createdAt: 'desc' }
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