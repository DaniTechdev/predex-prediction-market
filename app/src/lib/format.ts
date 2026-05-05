import BN from "bn.js";
import { PRICE_SCALE, USDC_DECIMALS } from "./config";

const usdcDivisor = new BN(10).pow(new BN(USDC_DECIMALS));

export const fromUsdcRaw = (raw: BN | bigint | number): number => {
  const bn = BN.isBN(raw)
    ? raw
    : new BN(typeof raw === "bigint" ? raw.toString() : raw);
  const whole = bn.div(usdcDivisor).toNumber();
  const frac = bn.mod(usdcDivisor).toNumber() / 10 ** USDC_DECIMALS;
  return whole + frac;
};

export const toUsdcRaw = (usdc: number): BN => {
  const rounded = Math.round(usdc * 10 ** USDC_DECIMALS);
  return new BN(rounded);
};

export const fromShareRaw = (raw: BN | bigint | number): number =>
  fromUsdcRaw(raw);

export const fromPriceScaled = (scaled: BN | bigint | number): number => {
  const bn = BN.isBN(scaled)
    ? scaled
    : new BN(typeof scaled === "bigint" ? scaled.toString() : scaled);
  return bn.toNumber() / PRICE_SCALE;
};

export const formatUsdc = (
  amount: number,
  opts: { compact?: boolean } = {},
): string => {
  if (opts.compact && Math.abs(amount) >= 1_000) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatPercent = (p: number, digits = 1): string =>
  `${(p * 100).toFixed(digits)}%`;

export const formatProbability = (prob0to100: number): string =>
  `${prob0to100.toFixed(0)}%`;

export const shortAddr = (addr: string, head = 4, tail = 4): string =>
  addr.length <= head + tail + 1 ? addr : `${addr.slice(0, head)}…${addr.slice(-tail)}`;

export const formatRelativeTime = (unixSeconds: number): string => {
  const now = Math.floor(Date.now() / 1000);
  const diff = unixSeconds - now;
  const abs = Math.abs(diff);

  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.34524, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];

  let value = abs;
  let unit: Intl.RelativeTimeFormatUnit = "second";
  for (const [step, name] of units) {
    if (value < step) {
      unit = name;
      break;
    }
    value /= step;
  }

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  return rtf.format(Math.round(diff < 0 ? -value : value), unit);
};

export const formatDate = (unixSeconds: number): string =>
  new Date(unixSeconds * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
