/**
 * Map Anchor `CustomError` discriminants from the on-chain program to
 * human-friendly toast messages. Codes match programs/predex/src/errors.rs.
 * Anchor user-defined errors start at 6000 (0x1770).
 */
const PROGRAM_ERROR_MESSAGES: Record<number, string> = {
  6000: "Question is too long (max 200 characters)",
  6001: "End time must be in the future",
  6002: "Initial probability must be between 0 and 100",
  6003: "Confidence score must be between 0 and 100",
  6004: "AI recommendation must be Buy YES, Buy NO, or Hold",
  6005: "This market has already been resolved",
  6006: "This market hasn't been resolved yet",
  6007: "You don't own enough shares to sell that amount",
  6008: "Market is still active — wait for the deadline to resolve",
  6009: "Market is no longer accepting trades",
  6010: "You've already claimed your winnings on this market",
  6011: "Outcome must be YES or NO",
  6012: "You're not the creator of this market",
  6013: "Amount must be greater than zero",
  6014: "Pool doesn't have enough liquidity for this trade",
  6015: "You don't have any winnings to claim",
};

const PROGRAM_ERROR_BY_NAME: Record<string, string> = {
  QuestionTooLong: PROGRAM_ERROR_MESSAGES[6000],
  EndTimeInPast: PROGRAM_ERROR_MESSAGES[6001],
  InvalidProbability: PROGRAM_ERROR_MESSAGES[6002],
  InvalidConfidence: PROGRAM_ERROR_MESSAGES[6003],
  InvalidRecommendation: PROGRAM_ERROR_MESSAGES[6004],
  MarketAlreadyResolved: PROGRAM_ERROR_MESSAGES[6005],
  MarketNotResolved: PROGRAM_ERROR_MESSAGES[6006],
  InsufficientShares: PROGRAM_ERROR_MESSAGES[6007],
  MarketStillActive: PROGRAM_ERROR_MESSAGES[6008],
  MarketNotActive: PROGRAM_ERROR_MESSAGES[6009],
  AlreadyClaimed: PROGRAM_ERROR_MESSAGES[6010],
  InvalidOutcome: PROGRAM_ERROR_MESSAGES[6011],
  Unauthorized: PROGRAM_ERROR_MESSAGES[6012],
  InvalidAmount: PROGRAM_ERROR_MESSAGES[6013],
  InsufficientLiquidity: PROGRAM_ERROR_MESSAGES[6014],
  NothingToClaim: PROGRAM_ERROR_MESSAGES[6015],
};

/**
 * Anchor's built-in constraint errors (ConstraintHasOne, etc.) — surfaced
 * as friendly text since users don't care about Anchor's internals.
 */
const ANCHOR_BUILTIN_PATTERNS: Array<[RegExp, string]> = [
  [/ConstraintHasOne/i, "You're not authorized for this action"],
  [/ConstraintSeeds/i, "Account doesn't match the expected program-derived address"],
  [/AccountNotInitialized/i, "Required account doesn't exist on-chain yet"],
  [/AccountOwnedByWrongProgram/i, "Account is owned by the wrong program"],
];

export function parseTxError(err: unknown): string {
  if (!err) return "Something went wrong";

  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : JSON.stringify(err);
  const msg = raw ?? "";
  const lower = msg.toLowerCase();

  // User cancelled in their wallet
  if (
    lower.includes("user rejected") ||
    lower.includes("rejected by user") ||
    lower.includes("user denied") ||
    lower.includes("transaction cancelled")
  ) {
    return "Transaction cancelled";
  }

  // Wallet missing-signature → usually mobile WC bug, see ConnectButton
  if (lower.includes("missing signature for public key")) {
    return "Wallet didn't sign the transaction. If you're on mobile, try Open in Phantom.";
  }

  // SOL fee shortfall
  if (
    lower.includes("insufficient lamports") ||
    lower.includes("insufficient funds for rent") ||
    lower.includes("attempt to debit an account but found no record")
  ) {
    return "Not enough SOL in your wallet for transaction fees";
  }

  // USDC / SPL token shortfall
  if (lower.includes("insufficient funds") || lower.includes("0x1")) {
    if (lower.includes("token")) return "Not enough USDC in your wallet";
  }

  // Stale blockhash
  if (lower.includes("blockhash not found") || lower.includes("blockhash") && lower.includes("expired")) {
    return "Transaction expired — please try again";
  }

  // RPC throttling
  if (lower.includes("rate limit") || lower.includes("429") || lower.includes("too many requests")) {
    return "RPC is rate-limited. Wait a moment and try again.";
  }

  // Network
  if (
    lower.includes("failed to fetch") ||
    lower.includes("network request failed") ||
    lower.includes("network error")
  ) {
    return "Network error — check your connection";
  }

  // Anchor: "AnchorError ... Error Code: <Name>. Error Number: <N>."
  const anchorMatch = msg.match(/Error Code:\s*(\w+)\.?\s*Error Number:\s*(\d+)/);
  if (anchorMatch) {
    const [, name, numStr] = anchorMatch;
    const num = Number(numStr);
    return PROGRAM_ERROR_MESSAGES[num] ?? PROGRAM_ERROR_BY_NAME[name] ?? `Program error: ${name}`;
  }

  // Hex code only: "custom program error: 0x1775"
  const hexMatch = msg.match(/custom program error:?\s*0x([0-9a-f]+)/i);
  if (hexMatch) {
    const code = parseInt(hexMatch[1], 16);
    return PROGRAM_ERROR_MESSAGES[code] ?? `Program rejected the transaction (0x${hexMatch[1]})`;
  }

  // Decimal code: "Error Code: 6005"
  const decMatch = msg.match(/error\s+code:?\s*(\d{4,5})/i);
  if (decMatch) {
    const code = Number(decMatch[1]);
    if (PROGRAM_ERROR_MESSAGES[code]) return PROGRAM_ERROR_MESSAGES[code];
  }

  // Just the error name surfaced (e.g. "MarketAlreadyResolved")
  for (const [name, friendly] of Object.entries(PROGRAM_ERROR_BY_NAME)) {
    if (msg.includes(name)) return friendly;
  }

  // Anchor built-in constraints
  for (const [pattern, friendly] of ANCHOR_BUILTIN_PATTERNS) {
    if (pattern.test(msg)) return friendly;
  }

  // Simulation failure with no parsed cause — peek into logs if present
  if (lower.includes("simulation failed") || lower.includes("simulate")) {
    return "Transaction failed during simulation. Please retry.";
  }

  // Truncate long stack-traced messages
  const firstLine = msg.split("\n")[0]?.trim() ?? msg;
  return firstLine.length > 120 ? `${firstLine.slice(0, 120)}…` : firstLine || "Something went wrong";
}
