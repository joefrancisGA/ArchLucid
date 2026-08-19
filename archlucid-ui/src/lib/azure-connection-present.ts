import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { formatInstantForLocale } from "@/lib/locale-datetime";

/** Shared presentation helpers for Azure cloud connection UI (TB-1767). */

export function azureConnectionStatusTagKind(): EnterpriseStatusKind {
  return "ready";
}

export function formatAzureConnectionTimestamp(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim().length === 0) {
    return "Never";
  }

  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    return value;
  }

  return formatInstantForLocale(value);
}

export function formatAzureSubscriptionSummary(subscriptionIds: string): string {
  const parts = subscriptionIds
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return "—";
  }

  if (parts.length === 1) {
    return parts[0] ?? "—";
  }

  return `${parts[0]} (+${parts.length - 1} more)`;
}
