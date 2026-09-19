import { NextResponse, type NextRequest } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { authenticate } from "@/lib/users";

export async function POST(request: NextRequest) {
  let username: string;
  let password: string;
  try {
    const body = await request.json();
    username = String(body.username ?? "");
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  let user;
  try {
    user = authenticate(username, password);
  } catch {
    return NextResponse.json({ error: "Server belum dikonfigurasi (daftar pengguna kosong)." }, { status: 500 });
  }

  if (!user) {
    // Deliberately does not say which of the two was wrong.
    return NextResponse.json({ error: "Username atau password salah." }, { status: 401 });
  }

  const { token, maxAge } = await createSessionToken(user.username);
  const response = NextResponse.json({ ok: true, name: user.name });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return response;
}
