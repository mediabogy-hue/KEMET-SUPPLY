import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // This server-side route is deprecated. The logic has been moved to a client-side
    // Firestore Transaction for better security and reliability in src/app/(main)/reports/_components/withdrawal-dialog.tsx.
    return NextResponse.json({
      ok: false,
      message: "This API endpoint is deprecated. Use the client-side implementation."
    }, { status: 410 }); // 410 Gone

  } catch (error: any) {
    console.error("Deprecated Withdraw API Error:", error);
    return NextResponse.json(
      { ok: false, message: error?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
