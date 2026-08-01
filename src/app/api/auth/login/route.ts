import { NextResponse, type NextRequest } from "next/server";
import { checkPassword, createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let password: string;
  try {
    const body = await request.json();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  let valid: boolean;
  try {
    valid = checkPassword(password);
  } catch {
    return NextResponse.json(
      { error: "Server belum dikonfigurasi (DASHBOARD_PASSWORD kosong)." },
      { status: 500 }
    );
  }

  if (!valid) {
    return NextResponse.json({ error: "Password salah." }, { status: 401 });
  }

  const { token, maxAge } = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return response;
}
