"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Smartphone, Link2, LogOut, Copy, Check } from "lucide-react";
import { WalletButton } from "./WalletButton";
import { Button } from "@/components/ui/Button";
import {
  isInWalletBrowser,
  isMobileUA,
  phantomBrowseLink,
  solflareBrowseLink,
} from "@/lib/mobile";
import { shortAddr } from "@/lib/format";

const HAS_WALLETCONNECT = Boolean(
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
);

/**
 * Mobile browsers can't detect injected wallets, and the standard wallet
 * modal sends users to the install page when they pick a wallet that
 * isn't there. Take full control on mobile: explicit picker when
 * disconnected, address + disconnect when connected.
 */
export function ConnectButton() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileUA() && !isInWalletBrowser());
  }, []);

  if (!isMobile) {
    return <WalletButton />;
  }

  return <MobileConnect />;
}

function MobileConnect() {
  const { connected, publicKey, disconnect, wallet, wallets, select } = useWallet();
  const { setVisible } = useWalletModal();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopy = async () => {
    if (!publicKey) return;
    await navigator.clipboard.writeText(publicKey.toBase58());
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleDisconnect = async () => {
    await disconnect();
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button onClick={() => setOpen((o) => !o)} className="!h-[42px]" type="button">
        {connected && publicKey ? (
          <>
            <span className="size-2 rounded-full bg-success" />
            {shortAddr(publicKey.toBase58())}
          </>
        ) : (
          <>
            <Smartphone className="size-4" /> Connect wallet
          </>
        )}
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
            {connected && publicKey ? (
              <ConnectedSheet
                address={publicKey.toBase58()}
                walletName={wallet?.adapter.name ?? "Wallet"}
                copied={copied}
                onCopy={handleCopy}
                onDisconnect={handleDisconnect}
              />
            ) : (
              <DisconnectedSheet
                showWalletConnect={Boolean(HAS_WALLETCONNECT && wcAdapter)}
                onWalletConnect={handleWalletConnect}
                onClose={() => setOpen(false)}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DisconnectedSheet({
  showWalletConnect,
  onWalletConnect,
  onClose,
}: {
  showWalletConnect: boolean;
  onWalletConnect: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="text-center mb-4">
        <h3 className="font-semibold text-base">Connect wallet</h3>
        <p className="text-sm text-foreground-muted mt-1">
          Pick how you want to connect on mobile.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {showWalletConnect ? (
          <button
            type="button"
            onClick={onWalletConnect}
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
          onClick={onClose}
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
    </>
  );
}

function ConnectedSheet({
  address,
  walletName,
  copied,
  onCopy,
  onDisconnect,
}: {
  address: string;
  walletName: string;
  copied: boolean;
  onCopy: () => void;
  onDisconnect: () => void;
}) {
  return (
    <>
      <div className="text-center mb-4">
        <p className="text-xs uppercase tracking-wider text-foreground-faint">{walletName}</p>
        <p className="font-mono text-sm mt-1 break-all">{shortAddr(address, 8, 8)}</p>
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onCopy}
          className="h-11 rounded-[10px] bg-background-overlay text-foreground border border-border-strong font-medium flex items-center justify-center gap-2 hover:bg-[rgb(var(--border-strong))] transition-colors"
        >
          {copied ? (
            <>
              <Check className="size-4 text-success" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-4" /> Copy address
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onDisconnect}
          className="h-11 rounded-[10px] bg-danger/10 text-danger border border-danger/30 font-medium flex items-center justify-center gap-2 hover:bg-danger/20 transition-colors"
        >
          <LogOut className="size-4" /> Disconnect
        </button>
      </div>
    </>
  );
}
