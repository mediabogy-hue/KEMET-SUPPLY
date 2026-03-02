import { NextResponse } from "next/server";

// This API route has been deprecated. The withdrawal logic is now client-side.
export async function POST(req: Request) {
    return NextResponse.json({ error: "This API endpoint is no longer in use." }, { status: 410 });
}
