import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// This API route has been disabled because the underlying web scraping
// feature is unreliable against modern e-commerce anti-bot measures.
// To prevent user frustration, the feature has been removed from the UI.
export async function POST(req: Request) {
    return NextResponse.json(
        { error: "The scraping feature has been disabled due to instability." },
        { status: 410 } // 410 Gone
    );
}
