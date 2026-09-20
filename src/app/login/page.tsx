"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, Eye, EyeOff, LineChart, Lock, ShieldCheck, User } from "lucide-react";

const HIGHLIGHTS = [
  { icon: LineChart, text: "Omzet, pengeluaran, dan profit secara real-time" },
  { icon: Activity, text: "Kunjungan pasien, layanan, dan performa staf" },
  { icon: ShieldCheck, text: "Data internal, hanya untuk tim ZEA Medika Farma" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Gagal masuk.");
        return;
      }
      const next = searchParams.get("next") || "/";
      router.replace(next);
      router.refresh();
    } catch {
      setError("Tidak bisa terhubung ke server. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel. On phones it collapses to a compact navy header so the
          form stays above the fold. */}
      <aside className="relative flex flex-col justify-between overflow-hidden bg-[var(--brand-deep)] px-6 py-8 text-white sm:px-10 lg:px-14 lg:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(1100px 520px at 12% -10%, rgba(255,255,255,0.16), transparent 60%)," +
              "radial-gradient(760px 420px at 105% 110%, rgba(43,120,214,0.34), transparent 62%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(70% 60% at 30% 20%, #000 20%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(70% 60% at 30% 20%, #000 20%, transparent 78%)",
          }}
        />

        <div className="relative">
          <Image
            src="/zea-logo-white.png"
            alt="ZEA Medika Farma"
            width={1284}
            height={293}
            priority
            className="h-9 w-auto sm:h-11"
          />
        </div>

        <div className="relative mt-8 hidden lg:block">
          <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-white/55">Dashboard Internal</p>
          <h1 className="mt-3 max-w-md text-[34px] font-semibold leading-[1.15] tracking-tight">
            Semua angka klinik &amp; apotek, dalam satu layar.
          </h1>
          <ul className="mt-8 flex flex-col gap-3.5">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-[15px] text-white/85">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/15">
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-8 hidden text-xs text-white/40 lg:block">
          © {new Date().getFullYear()} ZEA Medika Farma · Medical and Pharmaceutical
        </p>
      </aside>

      {/* Form side */}
      <main className="flex items-center justify-center bg-background px-6 py-10 sm:px-10">
        <div className="w-full max-w-[380px]">
          <div className="mb-7">
            <h2 className="text-[22px] font-semibold tracking-tight text-foreground">Selamat datang</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Masuk dengan akun Anda untuk melihat data internal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-[13px] font-medium text-foreground">
                Username
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoFocus
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="nama pengguna"
                  required
                  className="h-11 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/12"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[13px] font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 w-full rounded-xl border border-input bg-card pl-9 pr-11 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2.5 text-[13px] font-medium text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-[var(--shadow-raised)] transition-all hover:opacity-95 focus:outline-none focus:ring-4 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
            >
              {loading ? "Memeriksa…" : "Masuk ke Dashboard"}
            </button>
          </form>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Koneksi terenkripsi · sesi berlaku 30 hari
          </p>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
