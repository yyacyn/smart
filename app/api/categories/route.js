import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import imageKit from '@/configs/imageKit';

const prisma = new PrismaClient();

// GET: mengambil semua kategori (termasuk relasi parentCategory dan subcategories)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    const categories = await prisma.category.findMany({
      skip: skip,
      take: limit,
      include: {
        parentCategory: true,
        subcategories: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const total = await prisma.category.count();
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: categories,
      meta: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'An error occurred while fetching categories' 
      },
      { status: 500 }
    );
  }
}

// POST: menambah kategori baru
export async function POST(request) {
  try {
    const formData = await request.formData();
    
    const name = formData.get('name');
    const description = formData.get('description') || null;
    const status = formData.get('status').toUpperCase() || 'ACTIVE';
    const metaTitle = formData.get('metaTitle') || null;
    const metaDescription = formData.get('metaDescription') || null;
    const sortOrder = parseInt(formData.get('sortOrder')) || 0;
    const parentCategoryId = formData.get('parentCategoryId') ? parseInt(formData.get('parentCategoryId')) : null;
    const image = formData.get('image');

    // Generate slug from name if not provided
    const slug = formData.get('slug') || name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    let imageUrl = null;

    // If image is provided, upload to imageKit
    if (image && image.size > 0) {
      const buffer = Buffer.from(await image.arrayBuffer());
      
      const uploadResponse = await imageKit.upload({
        file: buffer,
        fileName: image.name,
        folder: "categories",
      });

      imageUrl = imageKit.url({
        path: uploadResponse.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { height: "512" }
        ]
      });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        image: imageUrl,
        status,
        slug,
        metaTitle,
        metaDescription,
        sortOrder,
        parentCategoryId
      },
      include: {
        parentCategory: true,
        subcategories: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: category 
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'An error occurred while creating category' 
      },
      { status: 500 }
    );
  }
}