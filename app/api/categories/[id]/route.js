import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import imageKit from '@/configs/imageKit';

const prisma = new PrismaClient();

// GET: ambil detail satu kategori berdasarkan id
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const categoryId = parseInt(id);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid category ID' 
        },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        parentCategory: true,
        subcategories: true
      }
    });

    if (!category) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Category not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: category 
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'An error occurred while fetching category' 
      },
      { status: 500 }
    );
  }
}

// PUT: update kategori
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const categoryId = parseInt(id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid category ID' 
        },
        { status: 400 }
      );
    }

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
    } else {
      // If no new image provided, keep the existing image
      const existingCategory = await prisma.category.findUnique({
        where: { id: categoryId }
      });
      imageUrl = existingCategory.image;
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
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
    console.error('Error updating category:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'An error occurred while updating category' 
      },
      { status: 500 }
    );
  }
}

// DELETE: hapus kategori
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const categoryId = parseInt(id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid category ID' 
        },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        subcategories: true
      }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Category not found' 
        },
        { status: 404 }
      );
    }

    // Update subcategories to remove the parentCategoryId reference
    if (existingCategory.subcategories.length > 0) {
      await prisma.category.updateMany({
        where: { parentCategoryId: categoryId },
        data: { parentCategoryId: null }
      });
    }

    // Delete the category
    await prisma.category.delete({
      where: { id: categoryId }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Category deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'An error occurred while deleting category' 
      },
      { status: 500 }
    );
  }
}