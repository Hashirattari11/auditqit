import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auditId = params.id;
    const audit = await db.getRepoAudit(auditId);

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    if (audit.user_id && audit.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.deleteRepoAudit(auditId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete repo audit:', error);
    return NextResponse.json({ error: 'Failed to delete audit' }, { status: 500 });
  }
}
