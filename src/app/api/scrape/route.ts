import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // This feature has been disabled and replaced with direct file uploads.
  // Returning an error to indicate the feature is no longer available.
  return NextResponse.json(
    { error: 'This scraping feature is no longer available.' },
    { status: 410 } // 410 Gone
  );
}
