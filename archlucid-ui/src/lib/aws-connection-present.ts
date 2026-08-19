import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { formatInstantForLocale } from "@/lib/locale-datetime";

/** Shared presentation helpers for AWS cloud connection UI (TB-1762). */

export function formatAwsConnectionTimestamp(value: string | null): string {
  if (value === null || value.trim().length === 0) {
    return "Never";
  }

  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    return value;
  }

  return formatInstantForLocale(value);
}

export function awsConnectionStatusTagKind(status: string): EnterpriseStatusKind {
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
