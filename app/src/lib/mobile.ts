"use client";

export const isBrowser = () => typeof window !== "undefined";

export const isMobileUA = (): boolean => {
  if (!isBrowser()) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
};

/**
 * True when the page is loaded inside a Solana wallet's in-app browser
 * (Phantom, Solflare, etc.) — meaning a wallet is already injected and the
 * standard adapter flow will work.
 */
export const isInWalletBrowser = (): boolean => {
  if (!isBrowser()) return false;
  const w = window as unknown as {
    phantom?: { solana?: unknown };
    solana?: { isPhantom?: boolean };
    solflare?: unknown;
  };
  return Boolean(w.phantom?.solana || w.solana?.isPhantom || w.solflare);
};

export const phantomBrowseLink = (url?: string, ref?: string): string => {
  const target = url ?? (isBrowser() ? window.location.href : "");
  const refOrigin = ref ?? (isBrowser() ? window.location.origin : "");
  return `https://phantom.app/ul/browse/${encodeURIComponent(target)}?ref=${encodeURIComponent(refOrigin)}`;
};

export const solflareBrowseLink = (url?: string, ref?: string): string => {
  const target = url ?? (isBrowser() ? window.location.href : "");
  const refOrigin = ref ?? (isBrowser() ? window.location.origin : "");
  return `https://solflare.com/ul/v1/browse/${encodeURIComponent(target)}?ref=${encodeURIComponent(refOrigin)}`;
};
