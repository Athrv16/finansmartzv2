import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const goals = await db.goal.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ goals });
  } catch (err) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const body = await req.json();
    const { name, targetAmount, targetDate } = body;
    if (!name || !targetAmount || !targetDate) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const goal = await db.goal.create({
      data: {
        name,
        targetAmount: Number(targetAmount),
        targetDate: new Date(targetDate),
        userId: user.id,
      },
    });
    return NextResponse.json({ goal });
  } catch (err) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const body = await req.json();
    const { id, name, targetAmount, targetDate, currentAmount } = body;
    if (!id) return NextResponse.json({ error: 'Missing goal id' }, { status: 400 });
    const goal = await db.goal.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(targetAmount && { targetAmount: Number(targetAmount) }),
        ...(targetDate && { targetDate: new Date(targetDate) }),
        ...(currentAmount && { currentAmount: Number(currentAmount) }),
      },
    });
    return NextResponse.json({ goal });
  } catch (err) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'Missing goal id' }, { status: 400 });
    await db.goal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}