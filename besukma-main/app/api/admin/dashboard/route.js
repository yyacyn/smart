import { getAuth } from "@clerk/nextjs/server"
import authAdmin from "@/middlewares/authAdmin";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Mengambil data dashboard untuk admin
export async function GET(request) {

  try {
    const { userId } = getAuth(request)
    const isAdmin = await authAdmin(userId)
  
    if(!isAdmin){
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  
    // ambil total order
    const orders = await prisma.order.count();
    // ambil total store
    const stores = await prisma.store.count();
    // ambil semua order hanya createdAt dan totalnya saja, lalu hitung total pendapatan
    const allOrders = await prisma.order.findMany({
      select: {
        createdAt: true,
        total: true
      }
    })
    const users = await prisma.user.count();
  
    let totalRevenue = 0;
    allOrders.forEach(order => {
      totalRevenue += order.total;
    })
  
    const revenue = totalRevenue.toFixed(2);
  
    // ambil total produk
    const products = await prisma.product.count();
    const dashboardData = {
      orders,
      stores,
      products,
      revenue,
      allOrders,
      users
    }
  
    return NextResponse.json({ dashboardData });
  } catch (error) {
    console.error("Error in admin dashboard GET route:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}