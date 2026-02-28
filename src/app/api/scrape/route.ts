import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    // Dynamically import the handler to keep heavy server-only deps out of the build graph
    const { handleScrape } = await import('./handler');
    return await handleScrape(req);
  } catch (e: any) {
    console.error("Scrape API Route Error:", e);
    // Return a generic error to the client
    return NextResponse.json(
      { error: "An unexpected error occurred on the server." },
      { status: 500 }
    );
  }
}
