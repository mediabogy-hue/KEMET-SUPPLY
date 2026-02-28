import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const { handleWithdraw } = await import("./handler");
    return await handleWithdraw(req);
  } catch (e: any) {
    // This will catch errors during the dynamic import itself, which is unlikely but possible.
    console.error("Withdrawal API Route Error:", e);
    return NextResponse.json({ error: "Failed to load API handler." }, { status: 500 });
  }
}
