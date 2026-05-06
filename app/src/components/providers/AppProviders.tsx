"use client";

import { useMemo, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import {
  SolanaMobileWalletAdapter,
  createDefaultAddressSelector,
  createDefaultAuthorizationResultCache,
  createDefaultWalletNotFoundHandler,
} from "@solana-mobile/wallet-adapter-mobile";
import { WalletConnectWalletAdapter } from "@solana/wallet-adapter-walletconnect";
import { WalletAdapterNetwork, type Adapter } from "@solana/wallet-adapter-base";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RPC_ENDPOINT, NETWORK, SITE } from "@/lib/config";

import "@solana/wallet-adapter-react-ui/styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const wcNetwork =
  NETWORK === "mainnet-beta"
    ? WalletAdapterNetwork.Mainnet
    : WalletAdapterNetwork.Devnet;

export function AppProviders({ children }: { children: ReactNode }) {
  const wallets = useMemo<Adapter[]>(() => {
    const list: Adapter[] = [
      new SolanaMobileWalletAdapter({
        addressSelector: createDefaultAddressSelector(),
        appIdentity: {
          name: SITE.name,
          uri: typeof window !== "undefined" ? window.location.origin : "",
        },
        authorizationResultCache: createDefaultAuthorizationResultCache(),
        chain: NETWORK === "mainnet-beta" ? "solana:mainnet" : `solana:${NETWORK}`,
        onWalletNotFound: createDefaultWalletNotFoundHandler(),
      }),
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ];

    const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    if (wcProjectId) {
      list.push(
        new WalletConnectWalletAdapter({
          network: wcNetwork,
          options: {
            projectId: wcProjectId,
            metadata: {
              name: SITE.name,
              description: SITE.description,
              url: typeof window !== "undefined" ? window.location.origin : "https://predex.app",
              icons: [
                typeof window !== "undefined"
                  ? `${window.location.origin}/favicon.ico`
                  : "https://predex.app/favicon.ico",
              ],
            },
          },
        }),
      );
    }

    return list;
  }, []);

  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT} config={{ commitment: "confirmed" }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
