import prisma from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import authAdmin from '@/middlewares/authAdmin';


// Note: status values are expected to be OrderStatus enum values (e.g. 'PROCESSING', 'SHIPPED')
const defaultDescriptions = {
  ORDER_PLACED: 'Order placed by customer',
  PROCESSING: 'Order is being prepared by shop',
  SHIPPED: 'Order has been shipped',
  DELIVERED: 'Order delivered to customer',
};


// GET: list timeline entries for an order
export async function GET(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Missing order id' }, { status: 400 });

    const timeline = await prisma.orderStatusHistory.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ timeline });
  } catch (error) {
    console.error('GET admin/orders/[id]/timeline error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch timeline' }, { status: 500 });
  }
}

// POST: add a timeline entry and optionally update order status
export async function POST(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Missing order id' }, { status: 400 });

    const body = await request.json();
    const { status, description } = body || {};
    if (!status) return NextResponse.json({ error: 'Missing status' }, { status: 400 });

    // use status as provided (expected to be an OrderStatus enum value)
    const statusTrim = typeof status === 'string' ? status.trim() : status;

    // set description to canonical text for the status to avoid mismatches
    let finalDescription = '';
    if (defaultDescriptions[statusTrim]) {
      finalDescription = defaultDescriptions[statusTrim];
      if (description && description.trim()) finalDescription += ` - ${description.trim()}`;
    } else {
      finalDescription = description || '';
    }

    const storedStatus = statusTrim;

    // create timeline entry
    const entry = await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: storedStatus,
        description: finalDescription,
        changedBy: userId || null,
      },
    });

    // try to update order.status if normalized value matches enum
    try {
      if (['ORDER_PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(storedStatus)) {
        await prisma.order.update({ where: { id }, data: { status: storedStatus } });
      }
    } catch (e) {
      console.warn('Failed to update order status (non-fatal):', e.message || e);
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('POST admin/orders/[id]/timeline error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to add timeline entry' }, { status: 500 });
  }
}
