import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { token } = await request.json();
  const c = await cookies();
  c.set("auth-token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const c = await cookies();
  c.delete("auth-token");
  return NextResponse.json({ ok: true });
}
