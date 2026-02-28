import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { handleDiag } = await import("./handler");
    return await handleDiag();
  } catch (e: any) {
    console.error("Diag Route Error:", e);
    return NextResponse.json({ error: "Failed to load diag handler." }, { status: 500 });
  }
}
