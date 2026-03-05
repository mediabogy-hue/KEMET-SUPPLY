import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    return NextResponse.json(
      { status: "withdraw API not implemented yet" },
      { status: 501 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
