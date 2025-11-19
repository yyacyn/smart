import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import imageKit from "@/configs/imageKit";
import prisma from "@/lib/prisma";

// Create the store
export async function POST(request) {
  try {
    const {userId} = getAuth(request);
    // Get the data from the form
    const formData = await request.formData();

    const name = formData.get("name");
    const username = formData.get("username");
    const description = formData.get("description");
    const email = formData.get("email");
    const contact = formData.get("contact");
    const address = formData.get("address");
    const image = formData.get("image");

    if (!name || !username || !description || !email || !contact || !address) {
      return NextResponse.json({error: "Missing store info"}, {status: 400});
    }

    // cek apakah user sudah punya store
    const store = await prisma.store.findFirst({
      where: { userId }
    })

    // kalau sudah punya store, return status store
    if(store){
      return NextResponse.json({status: store.status});
    }

    // check is username is already taken
    const isUsernameTaken = await prisma.store.findFirst({
      where: { username: username.toLowerCase() }
    })

    if(isUsernameTaken){
      return NextResponse.json({error: "Username is already taken"}, {status: 400});
    }

    // image upload to imagekit
    const buffer = Buffer.from(await image.arrayBuffer());
    const response = await imageKit.upload({
      file: buffer,
      fileName: image.name,
      folder: "logos",
    })

    const optimizedImage = imageKit.url({
      path: response.filePath,
      transformation: [
        {quality: "auto"},
        {format: "webp"},
        {height: "512"}
      ]
    })

    const newStore = await prisma.store.create({
      data: {
        userId,
        name,
        description,
        username: username.toLowerCase(),
        email,
        contact,
        address,
        logo: optimizedImage,
      }
    })

    // link store to user
    await prisma.user.update({
      where: { id: userId },
      data: { store: { connect: { id: newStore.id } } }
    })

    return NextResponse.json({message: "applied, waiting for approval"});

  } catch (error) {
    console.error(error);
    return NextResponse.json({error: error.code || error.message}, {status: 400});
  }
}

// cek apakah user sudah punya store, jika ya maka kirim status store
export async function GET(request) {
  try {
    const {userId} = getAuth(request);

    // cek apakah user sudah punya store
    const store = await prisma.store.findFirst({
      where: { userId }
    })

    // kalau sudah punya store, return status store
    if(store){
      return NextResponse.json({status: store.status});
    }

    return NextResponse.json({status: "not registered"});

  } catch (error) {
    console.error(error);
    return NextResponse.json({error: error.code || error.message}, {status: 400});
  }
}