import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const { handleBostaWebhook } = await import("./handler");
    return await handleBostaWebhook(req);
  } catch (e: any) {
    console.error("Bosta Webhook Route Error:", e);
    // Important: do not fail hard. Return 200 to avoid webhook retry storms.
    return NextResponse.json({ ok: true, error: e?.message || "error" });
  }
}
