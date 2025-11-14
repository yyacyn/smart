import prisma from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import authAdmin from '@/middlewares/authAdmin';

// GET /api/admin/reports/[id] - admin-only fetch single report
export async function GET(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const awaited = await params;
    const id = awaited.id;
    if (!id) return NextResponse.json({ error: 'Missing report id' }, { status: 400 });

  const report = await prisma.report.findUnique({ where: { id }, include: { reporter: { select: { id: true, name: true, email: true } } } });
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    return NextResponse.json({ report });
  } catch (error) {
    console.error('GET admin/reports/[id] error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch report' }, { status: 500 });
  }
}
