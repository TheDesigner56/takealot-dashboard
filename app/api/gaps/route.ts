import { NextResponse } from 'next/server';
import { getGaps } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const status = searchParams.get('status') || undefined;
    const minScore = searchParams.get('minScore') ? parseFloat(searchParams.get('minScore')!) : undefined;

    const result = await getGaps({ page, limit, status, minScore });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching gaps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gaps' },
      { status: 500 }
    );
  }
}
