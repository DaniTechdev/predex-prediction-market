import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import idl from "./idl/predex.json";
import type { Predex } from "./idl/predex";
import type { AnchorWallet } from "@solana/wallet-adapter-react";

export const getReadOnlyProgram = (connection: Connection): Program<Predex> => {
  const dummy: AnchorWallet = {
    publicKey: undefined as never,
    signTransaction: (() => {
      throw new Error("Read-only provider cannot sign");
    }) as never,
    signAllTransactions: (() => {
      throw new Error("Read-only provider cannot sign");
    }) as never,
  };
  const provider = new AnchorProvider(connection, dummy, {
    commitment: "confirmed",
  });
  return new Program<Predex>(idl as Predex, provider);
};

export const getProgram = (
  connection: Connection,
  wallet: AnchorWallet,
): Program<Predex> => {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program<Predex>(idl as Predex, provider);
};
