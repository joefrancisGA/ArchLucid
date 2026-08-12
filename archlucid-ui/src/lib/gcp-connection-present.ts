import type { EnterpriseStatusKind } from "@/lib/design-tokens";

/** Shared presentation helpers for GCP cloud connection UI (TB-1773). */

export function gcpConnectionStatusTagKind(status: string): EnterpriseStatusKind {
  switch (status.toLowerCase()) {
    case "connected":
      return "ready";
    case "polling":
      return "in-progress";
    case "error":
      return "blocked";
    default:
      return "neutral";
  }
}

export function formatGcpConnectionTimestamp(value: string | null): string {
  if (value === null || value.trim().length === 0) {
    return "Never";
  }

  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Date(parsed).toLocaleString();
}

export function gcpConnectionStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case "connected":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100";
    case "polling":
      return "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100";
    case "error":
      return "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100";
    default:
      return "bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-100";
  }
}
