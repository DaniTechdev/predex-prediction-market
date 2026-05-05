"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Smartphone } from "lucide-react";
import { WalletButton } from "./WalletButton";
import { Button } from "@/components/ui/Button";
import {
  isInWalletBrowser,
  isMobileUA,
  phantomBrowseLink,
  solflareBrowseLink,
} from "@/lib/mobile";

/**
 * On mobile browsers that aren't Phantom/Solflare's own in-app browser, the
 * standard wallet modal can't detect installed wallet apps and just sends
 * users to the download page. Show a deep-link option that opens the dApp
 * inside Phantom (or Solflare) where injection works.
 */
export function ConnectButton() {
  const { connected } = useWallet();
  const [showMobileHint, setShowMobileHint] = useState(false);

  useEffect(() => {
    setShowMobileHint(isMobileUA() && !isInWalletBrowser());
  }, []);

  if (connected || !showMobileHint) {
    return <WalletButton />;
  }

  return <MobileConnect />;
}

function MobileConnect() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        onClick={() => setOpen((o) => !o)}
        className="!h-[42px]"
        type="button"
      >
        <Smartphone className="size-4" /> Connect wallet
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-background-elevated border border-border-strong rounded-2xl p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <h3 className="font-semibold text-base">Open in your wallet</h3>
              <p className="text-sm text-foreground-muted mt-1">
                Mobile browsers can&apos;t detect wallet apps directly. Tap your wallet to open this site inside it.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href={phantomBrowseLink()}
                className="h-12 rounded-[10px] bg-[#AB9FF2] text-[#1A1A1A] font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                Open in Phantom
              </a>
              <a
                href={solflareBrowseLink()}
                className="h-12 rounded-[10px] bg-[#FFC209] text-[#1A1A1A] font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                Open in Solflare
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 mt-1 text-sm text-foreground-muted hover:text-foreground"
              >
                Cancel
              </button>
              <p className="text-xs text-foreground-faint text-center mt-2 leading-relaxed">
                Don&apos;t have a wallet?{" "}
                <a
                  href="https://phantom.app/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Install Phantom
                </a>
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
