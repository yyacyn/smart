import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/middlewares/authSeller";
import { PrismaClient } from '@prisma/client';
import imageKit from '@/configs/imageKit';

const prisma = new PrismaClient();

// GET: ambil detail store berdasarkan user id (menggunakan authSeller middleware)
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        category: true,
        Product: {
          select: {
            id: true,
            name: true,
            price: true,
            inStock: true
          },
          take: 10 // ambil 10 produk terbaru
        }
      }
    });

    if (!store) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Store not found' 
        },
        { status: 404 }
      );
    }

    // Ambil informasi tambahan
    const totalProducts = await prisma.product.count({
      where: { storeId: storeId }
    });

    const totalOrders = await prisma.order.count({
      where: { storeId: storeId }
    });

    const totalSalesResult = await prisma.order.aggregate({
      where: { 
        storeId: storeId,
        isPaid: true // hanya ambil order yang sudah dibayar
      },
      _sum: {
        total: true
      }
    });
    const totalSales = totalSalesResult._sum.total || 0;

    // Ambil rating rata-rata
    const avgRatingResult = await prisma.rating.aggregate({
      where: {
        product: {
          storeId: storeId
        }
      },
      _avg: {
        rating: true
      }
    });
    const avgRating = avgRatingResult._avg.rating || 0;

    // Gabungkan data store dengan informasi tambahan
    const storeWithStats = {
      ...store,
      totalProducts,
      totalOrders,
      totalSales,
      avgRating: parseFloat(avgRating.toFixed(2))
    };

    return NextResponse.json({ 
      success: true, 
      data: storeWithStats 
    });
  } catch (error) {
    console.error('Error fetching store:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'An error occurred while fetching store' 
      },
      { status: 500 }
    );
  }
}

// PUT: update store (menggunakan authSeller middleware)
export async function PUT(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);
    
    const formData = await request.formData();
    
    const name = formData.get('name');
    const username = formData.get('username');
    const description = formData.get('description');
    const email = formData.get('email');
    const contact = formData.get('contact');
    const address = formData.get('address');
    const website = formData.get('website');
    const logo = formData.get('logo');
    
    // Cek apakah store ada
    const existingStore = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!existingStore) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Store not found' 
        },
        { status: 404 }
      );
    }

    // Validasi username jika diubah
    if (username && username !== existingStore.username) {
      const existingUsername = await prisma.store.findFirst({
        where: { username: username.toLowerCase() }
      });

      if (existingUsername && existingUsername.id !== storeId) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Username is already taken' 
          },
          { status: 400 }
        );
      }
    }

    let logoUrl = existingStore.logo; // Gunakan logo yang ada jika tidak ada upload baru

    // Jika logo baru diupload, proses dengan imageKit
    if (logo && logo.size > 0) {
      const buffer = Buffer.from(await logo.arrayBuffer());
      
      const uploadResponse = await imageKit.upload({
        file: buffer,
        fileName: logo.name,
        folder: "logos",
      });

      logoUrl = imageKit.url({
        path: uploadResponse.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { height: "512" }
        ]
      });
    }
 
    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        name,
        username: username ? username.toLowerCase() : existingStore.username,
        description,
        email,
        contact,
        address,
        website: website || null,
        logo: logoUrl
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        category: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedStore 
    });
  } catch (error) {
    console.error('Error updating store:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'An error occurred while updating store' 
      },
      { status: 500 }
    );
  }
}