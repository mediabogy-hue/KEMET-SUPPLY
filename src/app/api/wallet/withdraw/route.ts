import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // This server-side API has been deprecated and its logic moved client-side
  // to ensure transactional safety with Firestore.
  return NextResponse.json(
    { error: 'This API endpoint is no longer in use.' },
    { status: 410 } // 410 Gone
  );
}
