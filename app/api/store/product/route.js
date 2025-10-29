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
    const category = formData.get("category");
    const images = formData.getAll("images");

    if(!name || !description || !mrp || !price || !category || images.length < 1){
      return NextResponse.json({ error: "Missing product details" }, { status: 400 });
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
        category,
        images: imagesUrl,
        storeId,
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
    
    const products = await prisma.product.findMany({ where: { storeId } });

    return NextResponse.json({ products });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}