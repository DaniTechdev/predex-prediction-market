import Link from "next/link";
import { ExternalLink, Code2 } from "lucide-react";
import { explorerUrl, NETWORK, PROGRAM_ID, SITE } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-background/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div>
          <p className="font-semibold text-foreground">{SITE.name}</p>
          <p className="text-foreground-muted mt-1.5 max-w-xs leading-relaxed">{SITE.tagline}</p>
        </div>

        <div className="flex flex-col gap-1.5 text-foreground-muted">
          <Link href="/" className="hover:text-foreground transition-colors">Browse markets</Link>
          <Link href="/create" className="hover:text-foreground transition-colors">Create a market</Link>
          <Link href="/portfolio" className="hover:text-foreground transition-colors">Your portfolio</Link>
        </div>

        <div className="flex flex-col gap-1.5 text-foreground-muted">
          <a
            href={explorerUrl(PROGRAM_ID.toBase58())}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            Program on Explorer <ExternalLink className="size-3.5" />
          </a>
          <a
            href="https://github.com/DaniTechdev/predex-prediction-market"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Code2 className="size-3.5" /> Source
          </a>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success" /> {NETWORK}
          </span>
        </div>
      </div>
    </footer>
  );
}
