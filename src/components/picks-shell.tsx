"use client";

import { Trophy } from "lucide-react";

type PicksShellProps = Readonly<{
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}>;

export function PicksShell({
  title = "Close Call Fantasy Picks",
  subtitle = "Make your picks before lock. One selection per matchup.",
  children,
}: PicksShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 shadow-md">
              <Trophy className="h-7 w-7 text-white" aria-hidden />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">{title}</h1>
          </div>
          <p className="text-lg text-slate-600">{subtitle}</p>
        </header>
        {children}
      </div>
    </div>
  );
}
