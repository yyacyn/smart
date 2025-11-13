import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/middlewares/authSeller";
import imageKit from "@/configs/imageKit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// menambahkan produk baru
export async function POST(request) {
  try {
    const { userId } = getAuth(request)
    const storeId = await authSeller(userId);

    if(!storeId){
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ambil data dari form
    const formData = await request.formData();
    const name = formData.get("name");
    const description = formData.get("description");
    const mrp = Number(formData.get("mrp"));
    const price = Number(formData.get("price"));
    const category = formData.get("category"); // Ini akan menjadi categoryId
    const images = formData.getAll("images");
    
    // Field tambahan sesuai schema Prisma
    const inStock = formData.get("inStock") === 'true' || true;
    const stock = Number(formData.get("stock")) || 0;
    const minStock = Number(formData.get("minStock")) || 0;
    const weight = formData.get("weight") || null;
    const dimensions = formData.get("dimensions") || null;
    const model = formData.get("model") || null;
    const additionalInfo = formData.get("additionalInfo") || null;
    const status = formData.get("status") || "draft";
    const sku = formData.get("sku") || null;
    const barcode = formData.get("barcode") || null;
    const shippingWeight = formData.get("shippingWeight") || null;
    const shippingLength = formData.get("shippingLength") || null;
    const shippingWidth = formData.get("shippingWidth") || null;
    const shippingHeight = formData.get("shippingHeight") || null;
    const warranty = formData.get("warranty") || null;
    const returnPolicy = formData.get("returnPolicy") || null;
    const tags = formData.get("tags") || null;
    const metaTitle = formData.get("metaTitle") || null;
    const metaDescription = formData.get("metaDescription") || null;

    if(!name || !description || !mrp || !price || !category || images.length < 1){
      return NextResponse.json({ error: "Missing product details" }, { status: 400 });
    }

    // Validasi bahwa category ID yang diberikan benar-benar ada
    const categoryExists = await prisma.category.findUnique({
      where: { id: category }
    });
    
    if (!categoryExists) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Validasi apakah SKU atau barcode sudah ada (karena field unik di schema)
    if (sku) {
      const existingProductWithSKU = await prisma.product.findUnique({
        where: { sku: sku }
      });
      
      if (existingProductWithSKU) {
        return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
      }
    }
    
    if (barcode) {
      const existingProductWithBarcode = await prisma.product.findUnique({
        where: { barcode: barcode }
      });
      
      if (existingProductWithBarcode) {
        return NextResponse.json({ error: "Barcode already exists" }, { status: 409 });
      }
    }

    // upload gambar ke imagekit
    const imagesUrl = await Promise.all(images.map(async (image) => {
      const buffer = Buffer.from(await image.arrayBuffer());

      const response = await imageKit.upload({
        file: buffer,
        fileName: image.name,
        folder: "products",
      });

      const url = imageKit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { height: "1024" }
        ]
      })
      
      return url;
    }));

    await prisma.product.create({
      data: {
        name,
        description,
        mrp,
        price,
        categoryId: category,
        images: imagesUrl,
        storeId,
        inStock,
        stock,
        minStock,
        weight,
        dimensions,
        model,
        additionalInfo,
        status,
        sku,
        barcode,
        shippingWeight,
        shippingLength,
        shippingWidth,
        shippingHeight,
        warranty,
        returnPolicy,
        tags,
        metaTitle,
        metaDescription
      }
    })

    return NextResponse.json({ message: "Product added successfully" }, { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

// get semua produk untuk seller
export async function GET(request) {
  try {
    const { userId } = getAuth(request)
    const storeId = await authSeller(userId);

    if(!storeId){
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const products = await prisma.product.findMany({ 
      where: { storeId },
      include: {
        category: true,  // Tambahkan relasi category untuk mendapatkan informasi kategori
        variants: true   // Tambahkan relasi variants untuk mendapatkan informasi varian produk
      }
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}