"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, TrendingUp } from "lucide-react";
import { ConnectButton } from "./ConnectButton";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/config";

const NAV = [
  { href: "/", label: "Markets" },
  { href: "/create", label: "Create" },
  { href: "/portfolio", label: "Portfolio" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setOpen(false)}>
            <div className="size-8 rounded-lg bg-gradient-to-br from-[rgb(153_69_255)] to-[rgb(20_241_149)] flex items-center justify-center shadow-[0_0_18px_-3px_rgb(153_69_255_/_0.6)] group-hover:shadow-[0_0_22px_-2px_rgb(153_69_255_/_0.8)] transition-shadow">
              <TrendingUp className="size-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg tracking-tight">{SITE.name}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3.5 h-9 rounded-md flex items-center text-sm font-medium transition-colors",
                    active
                      ? "text-foreground bg-background-overlay"
                      : "text-foreground-muted hover:text-foreground hover:bg-background-overlay/50",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ConnectButton />
            <button
              type="button"
              className="md:hidden size-10 rounded-md flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-background-overlay"
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {open ? (
          <nav className="md:hidden pb-4 flex flex-col gap-1 border-t border-border pt-3">
            {NAV.map((item) => {
              const active = pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "px-3.5 h-11 rounded-md flex items-center text-sm font-medium transition-colors",
                    active
                      ? "text-foreground bg-background-overlay"
                      : "text-foreground-muted hover:text-foreground hover:bg-background-overlay/50",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
