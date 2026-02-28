// This feature has been temporarily disabled to resolve a critical application-wide build issue.
// The corresponding handler and Genkit/AI logic have been removed.
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    return NextResponse.json({ error: "This feature is temporarily disabled." }, { status: 503 });
}
