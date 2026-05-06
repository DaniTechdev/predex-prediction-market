"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Smartphone, Link2 } from "lucide-react";
import { WalletButton } from "./WalletButton";
import { Button } from "@/components/ui/Button";
import {
  isInWalletBrowser,
  isMobileUA,
  phantomBrowseLink,
  solflareBrowseLink,
} from "@/lib/mobile";

const HAS_WALLETCONNECT = Boolean(
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
);

/**
 * On mobile browsers that aren't a wallet's own in-app browser, the
 * standard wallet modal hides cross-browser options like WalletConnect.
 * We surface them explicitly: WalletConnect (cross-browser), or open
 * inside Phantom/Solflare via universal link.
 */
export function ConnectButton() {
  const { connected } = useWallet();
  const [showMobileSheet, setShowMobileSheet] = useState(false);

  useEffect(() => {
    setShowMobileSheet(isMobileUA() && !isInWalletBrowser());
  }, []);

  if (connected || !showMobileSheet) {
    return <WalletButton />;
  }

  return <MobileConnect />;
}

function MobileConnect() {
  const [open, setOpen] = useState(false);
  const { wallets, select } = useWallet();
  const { setVisible } = useWalletModal();

  const wcAdapter = wallets.find((w) => w.adapter.name === "WalletConnect");

  const handleWalletConnect = () => {
    if (!wcAdapter) {
      setVisible(true);
      setOpen(false);
      return;
    }
    select(wcAdapter.adapter.name);
    setOpen(false);
    requestAnimationFrame(() => setVisible(true));
  };

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
            className="w-full max-w-sm bg-background-elevated border border-border-strong rounded-2xl p-5 shadow-xl max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <h3 className="font-semibold text-base">Connect wallet</h3>
              <p className="text-sm text-foreground-muted mt-1">
                Pick how you want to connect on mobile.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {HAS_WALLETCONNECT && wcAdapter ? (
                <button
                  type="button"
                  onClick={handleWalletConnect}
                  className="h-12 rounded-[10px] bg-gradient-to-br from-[rgb(59_130_246)] to-[rgb(37_99_235)] text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Link2 className="size-4" /> WalletConnect
                </button>
              ) : null}
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
