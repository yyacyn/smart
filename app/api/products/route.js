import prisma from "@/lib/prisma";


export async function GET(request) {
  try {
    let products = await prisma.product.findMany({
      where: { inStock: true },
      include: {
        rating: {
          createdAt: true, rating: true, review: true,
          user: {select: {name: true, image: true}}
        },
        store: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    // hapus products yang store-nya inactive
    products = products.filter(product => product.store.isActive)
    return NextResponse.json({ products });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}