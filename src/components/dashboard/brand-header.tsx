"use client";

import Image from "next/image";
import { Activity, LogOut, UserRound, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardView } from "@/types";

const VIEWS: { id: DashboardView; label: string; icon: typeof Wallet }[] = [
  { id: "keuangan", label: "Keuangan", icon: Wallet },
  { id: "kunjungan", label: "Kunjungan Pasien", icon: Activity },
];

interface BrandHeaderProps {
  view: DashboardView;
  periodLabel: string;
  userName?: string;
  onViewChange: (view: DashboardView) => void;
  onLogout: () => void;
  actions?: React.ReactNode;
}

export function BrandHeader({ view, periodLabel, userName, onViewChange, onLogout, actions }: BrandHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-xl print:static print:bg-white">
      {/* Thin brand band: the navy from the mark, carried across the top. */}
      <div
        className="h-[3px] w-full print:hidden"
        style={{ background: "linear-gradient(90deg, var(--brand) 0%, var(--brand-deep) 55%, var(--brand-grey) 100%)" }}
      />
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Image
            src="/zea-logo.jpg"
            alt="ZEA Medika Farma"
            width={1284}
            height={293}
            priority
            className="h-8 w-auto sm:h-9"
          />
          <span className="hidden h-8 w-px bg-border sm:block" />
          <div className="hidden sm:block">
            <p className="text-[13px] font-semibold leading-tight text-foreground">Dashboard Internal</p>
            <p className="text-xs leading-tight text-muted-foreground">Periode {periodLabel}</p>
          </div>
        </div>

        <nav className="print-hidden order-3 flex w-full items-center gap-1 rounded-xl bg-muted p-1 sm:order-none sm:w-auto">
          {VIEWS.map(({ id, label, icon: Icon }) => {
            const active = view === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onViewChange(id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200 sm:flex-none",
                  active
                    ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="print-hidden ml-auto flex items-center gap-2">
          {actions}
          {userName && (
            <span className="hidden items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-[13px] text-muted-foreground lg:inline-flex">
              <UserRound className="h-4 w-4" aria-hidden />
              <span className="font-medium text-foreground">{userName}</span>
            </span>
          )}
          <button
            type="button"
            onClick={onLogout}
            title={userName ? `Keluar dari akun ${userName}` : "Keluar"}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
