import { NextResponse } from 'next/server';
import { getOpportunities } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const minMargin = searchParams.get('minMargin') ? parseFloat(searchParams.get('minMargin')!) : undefined;

    const result = await getOpportunities({ page, limit, minMargin });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
}
