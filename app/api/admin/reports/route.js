import prisma from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import authAdmin from '@/middlewares/authAdmin';

// GET /api/admin/reports - list customer reports (complaints)
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const qType = url.searchParams.get('type');
    const qStatus = url.searchParams.get('status');
    const qSearch = url.searchParams.get('q');

    const where = {};
    if (qType) {
      const map = String(qType).toUpperCase();
      if (['PRODUCT','STORE'].includes(map)) where.reportType = map;
    }
    if (qStatus) {
      const mapS = String(qStatus).toUpperCase();
      if (['NEW','REVIEWED','IN_PROGRESS','RESOLVED','REJECTED','CLOSED','ESCALATED'].includes(mapS)) where.status = mapS;
    }
    if (qSearch) {
      where.OR = [
        { subject: { contains: qSearch, mode: 'insensitive' } },
        { message: { contains: qSearch, mode: 'insensitive' } },
        { targetId: { contains: qSearch, mode: 'insensitive' } },
        { reporter: { name: { contains: qSearch, mode: 'insensitive' } } },
        { reporter: { email: { contains: qSearch, mode: 'insensitive' } } },
      ];
    }

    // Fetch reports (report model has reporter relation but not store/product relations)
    const reports = await prisma.report.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: { reporter: true },
      orderBy: { submittedAt: 'desc' },
      take: 100,
    });

    // Collect targetIds to hydrate store/product names without adding schema relations
    const storeIds = reports.filter(r => r.reportType === 'STORE').map(r => r.targetId).filter(Boolean);
    const productIds = reports.filter(r => r.reportType === 'PRODUCT').map(r => r.targetId).filter(Boolean);

    const [stores, products] = await Promise.all([
      storeIds.length ? prisma.store.findMany({ where: { id: { in: storeIds } } }) : Promise.resolve([]),
      productIds.length ? prisma.product.findMany({ where: { id: { in: productIds } } }) : Promise.resolve([]),
    ]);

    const storesById = new Map(stores.map(s => [s.id, s]));
    const productsById = new Map(products.map(p => [p.id, p]));

    const hydrated = reports.map(r => ({
      ...r,
      store: r.reportType === 'STORE' ? storesById.get(r.targetId) || null : null,
      product: r.reportType === 'PRODUCT' ? productsById.get(r.targetId) || null : null,
    }));

    return NextResponse.json({ reports: hydrated });
  } catch (error) {
    console.error('GET admin/reports error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch reports' }, { status: 500 });
  }
}

// POST /api/admin/reports - create a new report (for public use too)
export async function POST(request) {
  try {
    const body = await request.json();

    // Inference logic same as public endpoint: prefer productId, then storeId; reportType must be PRODUCT or STORE
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

    let suggestedPriority = null;
    if (body.suggestedPriority) {
      const up = String(body.suggestedPriority).toUpperCase();
      if (['LOW','MEDIUM','HIGH','URGENT'].includes(up)) suggestedPriority = up;
    }
    const initialPriority = suggestedPriority || (body.priority ? String(body.priority).toUpperCase() : 'MEDIUM');

    // normalize admin provided status (optional)
    let providedStatus = null;
    if (body.status) {
      const s = String(body.status).toUpperCase();
      if (['NEW','REVIEWED','IN_PROGRESS','RESOLVED','REJECTED','CLOSED','ESCALATED'].includes(s)) providedStatus = s;
    }

    const data = {
      // admin may provide reporterId to create on behalf of a user
      reporterId: body.reporterId || null,
      reportType: inferredType,
      targetId,
      subject: body.subject || '',
      message: body.message || '',
      suggestedPriority: suggestedPriority,
      priority: initialPriority,
      status: providedStatus || 'NEW',
      category: body.category || null,
      attachments: body.attachments || [],
    };

    const created = await prisma.report.create({ data });
    return NextResponse.json({ report: created }, { status: 201 });
  } catch (error) {
    console.error('POST admin/reports error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create report' }, { status: 500 });
  }
}
