import type { ProductLearningTimeRangeKey } from "./product-learning-types";

export function sinceIsoForRange(key: ProductLearningTimeRangeKey): string | null {
  if (key === "all") {
    return null;
  }

  const days = key === "7d" ? 7 : 30;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);

  return d.toISOString();
}

export function formatUtc(iso: string): string {
  try {
    return `${new Date(iso).toLocaleString(undefined, { timeZone: "UTC" })} UTC`;
  } catch {
    return iso;
  }
}

export function severityBadgeClass(severity: string): string {
  const s = severity.toLowerCase();
  const base = "px-2 py-0.5 rounded text-xs";

  if (s === "high") {
    return `${base} bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-400`;
  }

  if (s === "medium") {
    return `${base} bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400`;
  }

  return `${base} bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400`;
}

export const productLearningTableClass = "w-full border-collapse text-sm mt-2";

export const productLearningThTdClass =
  "border border-neutral-200 dark:border-neutral-700 px-2.5 py-2 text-left align-top";

export const productLearningNumericCellClass =
  "border border-neutral-200 dark:border-neutral-700 px-2.5 py-2 text-right align-top tabular-nums";
