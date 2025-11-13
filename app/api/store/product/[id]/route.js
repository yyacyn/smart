import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/middlewares/authSeller";
import imageKit from "@/configs/imageKit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// update produk
export async function PUT(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ambil ID produk dari URL (misalnya /api/store/product/[id])
    const { id } = params;

    // Cek apakah produk milik seller ini
    const existingProduct = await prisma.product.findUnique({
      where: { 
        id: id,
        storeId: storeId 
      }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Ambil data dari form
    const formData = await request.formData();
    const name = formData.get("name") || existingProduct.name;
    const description = formData.get("description") || existingProduct.description;
    const mrp = Number(formData.get("mrp")) || existingProduct.mrp;
    const price = Number(formData.get("price")) || existingProduct.price;
    const category = formData.get("category") || existingProduct.categoryId; // Ini akan menjadi categoryId

    // Field tambahan sesuai schema Prisma
    const inStock = formData.get("inStock") === 'true' || existingProduct.inStock;
    const stock = Number(formData.get("stock")) || existingProduct.stock || 0;
    const minStock = Number(formData.get("minStock")) || existingProduct.minStock || 0;
    const weight = formData.get("weight") || existingProduct.weight || null;
    const dimensions = formData.get("dimensions") || existingProduct.dimensions || null;
    const model = formData.get("model") || existingProduct.model || null;
    const additionalInfo = formData.get("additionalInfo") || existingProduct.additionalInfo || null;
    const status = formData.get("status") || existingProduct.status || "draft";
    const sku = formData.get("sku") || existingProduct.sku || null;
    const barcode = formData.get("barcode") || existingProduct.barcode || null;
    const shippingWeight = formData.get("shippingWeight") || existingProduct.shippingWeight || null;
    const shippingLength = formData.get("shippingLength") || existingProduct.shippingLength || null;
    const shippingWidth = formData.get("shippingWidth") || existingProduct.shippingWidth || null;
    const shippingHeight = formData.get("shippingHeight") || existingProduct.shippingHeight || null;
    const warranty = formData.get("warranty") || existingProduct.warranty || null;
    const returnPolicy = formData.get("returnPolicy") || existingProduct.returnPolicy || null;
    const tags = formData.get("tags") || existingProduct.tags || null;
    const metaTitle = formData.get("metaTitle") || existingProduct.metaTitle || null;
    const metaDescription = formData.get("metaDescription") || existingProduct.metaDescription || null;

    // Validasi bahwa category ID yang diberikan benar-benar ada
    const categoryExists = await prisma.category.findUnique({
      where: { id: category }
    });

    if (!categoryExists) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Validasi apakah SKU atau barcode baru sudah ada (untuk produk lain)
    if (sku && sku !== existingProduct.sku) {
      const existingProductWithSKU = await prisma.product.findUnique({
        where: { sku: sku }
      });

      if (existingProductWithSKU) {
        return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
      }
    }

    if (barcode && barcode !== existingProduct.barcode) {
      const existingProductWithBarcode = await prisma.product.findUnique({
        where: { barcode: barcode }
      });

      if (existingProductWithBarcode) {
        return NextResponse.json({ error: "Barcode already exists" }, { status: 409 });
      }
    }

    // Ambil gambar yang sudah ada dan tambahkan gambar baru jika ada
    let updatedImages = [...existingProduct.images]; // Tetapkan gambar yang sudah ada

    // Jika ada gambar baru diupload, tambahkan ke array
    const newImages = formData.getAll("images");
    if (newImages.length > 0) {
      const newImagesUrl = await Promise.all(newImages.map(async (image) => {
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

      updatedImages = [...updatedImages, ...newImagesUrl];
    }

    // Periksa apakah ingin menghapus gambar tertentu
    const imagesToDelete = formData.get("imagesToDelete"); // Ini bisa berupa string JSON yang berisi array indeks gambar yang akan dihapus
    if (imagesToDelete) {
      try {
        const indicesToDelete = JSON.parse(imagesToDelete);
        if (Array.isArray(indicesToDelete)) {
          updatedImages = updatedImages.filter((_, index) => !indicesToDelete.includes(index));
        }
      } catch (e) {
        // Jika tidak bisa parse JSON, abaikan
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: id },
      data: {
        name,
        description,
        mrp,
        price,
        categoryId: category,
        images: updatedImages,
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
    });

    return NextResponse.json({ message: "Product updated successfully", product: updatedProduct }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

// delete produk
export async function DELETE(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ambil ID produk dari URL (misalnya /api/store/product/[id])
    const { id } = params;

    // Cek apakah produk milik seller ini
    const existingProduct = await prisma.product.findUnique({
      where: { 
        id: id,
        storeId: storeId 
      }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Hapus produk
    await prisma.product.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: "Product deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}