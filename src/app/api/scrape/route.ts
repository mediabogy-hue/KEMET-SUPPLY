import { NextResponse } from 'next/server';

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
    try {
        const { handleScrape } = await import("./handler");
        return await handleScrape(req);
    } catch (e: any) {
        console.error("Scrape API Route Error:", e);
        return NextResponse.json({ error: "Failed to load API handler." }, { status: 500 });
    }
}
