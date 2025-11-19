import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/reports/[id] - public fetch single report by id
export async function GET(request, { params }) {
  try {
    const awaited = await params;
    const id = awaited.id;
    if (!id) return NextResponse.json({ error: 'Missing report id' }, { status: 400 });

  const report = await prisma.report.findUnique({ where: { id }, include: { reporter: { select: { id: true, name: true, email: true } } } });
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    return NextResponse.json({ report });
  } catch (error) {
    console.error('GET /api/reports/[id] error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch report' }, { status: 500 });
  }
}
