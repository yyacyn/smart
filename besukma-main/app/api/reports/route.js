import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

// Public endpoint to submit a customer report/complaint
export async function POST(request) {
  try {
    const body = await request.json();

    // Require authenticated reporter; store reporterId (reference to User)
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: 'Authentication required to submit report' }, { status: 401 });

    // Infer reportType and populate target fields. Require productId or storeId (enum only PRODUCT/STORE)
  let targetId = '';
    let inferredType = null;

    if (body.productId) {
      const product = await prisma.product.findUnique({ where: { id: body.productId } });
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  inferredType = 'PRODUCT';
  targetId = product.id;
    } else if (body.storeId) {
      const store = await prisma.store.findUnique({ where: { id: body.storeId } });
      if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  inferredType = 'STORE';
  targetId = store.id;
    } else {
      return NextResponse.json({ error: 'report must target a productId or storeId' }, { status: 400 });
    }

    // minimal validation: require core fields
    const required = ['subject', 'message'];
    for (const k of required) {
      if (!body[k]) return NextResponse.json({ error: `Missing field ${k}` }, { status: 400 });
    }

    // reporterId is taken from Clerk auth
    const reporterId = userId;

    // suggestedPriority (optional) from user: accept values low/medium/high/urgent (case-insensitive)
    let suggestedPriority = null;
    if (body.suggestedPriority) {
      const up = String(body.suggestedPriority).toUpperCase();
      if (['LOW','MEDIUM','HIGH','URGENT'].includes(up)) suggestedPriority = up;
    }

    // Determine initial priority: prefer suggestedPriority if present, otherwise MEDIUM
    const initialPriority = suggestedPriority || 'MEDIUM';

    const created = await prisma.report.create({ data: {
      reporterId,
      // reportType is Prisma enum: PRODUCT | STORE
      reportType: inferredType,
      targetId,
      subject: body.subject,
      message: body.message,
      suggestedPriority: suggestedPriority,
      priority: initialPriority,
      // status is an enum ReportStatus - public submissions always start as NEW
      status: 'NEW',
      category: body.category || null,
      attachments: body.attachments || [],
    } });

    return NextResponse.json({ report: created }, { status: 201 });
  } catch (error) {
    console.error('POST /api/reports error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create report' }, { status: 500 });
  }
}
