import type { EnterpriseStatusKind, FindingSeverityKind } from "@/lib/design-tokens";
import type { FindingConfidenceLevel } from "@/types/explanation";
import { normalizeFindingConfidenceLevel } from "@/types/explanation";

export function firstRecommendationSentence(text: string): string {
  const t = text.trim();

  if (t.length === 0) {
    return "";
  }

  const match = /^[\s\S]*?[.!?](?=\s|$)/.exec(t);

  if (match !== null) {
    return match[0].trim();
  }

  return t;
}

export function severityBadgeLabel(severityValue: number): string {
  switch (severityValue) {
    case 3:
      return "Critical";
    case 2:
      return "High";
    case 1:
      return "Medium";
    case 0:
    default:
      return "Info";
  }
}

/** Maps numeric quick-decision severity to SeverityTag kind. */
export function severityKindFromNumericValue(severityValue: number): FindingSeverityKind {
  switch (severityValue) {
    case 3:
      return "critical";

    case 2:
      return "high";

    case 1:
      return "medium";

    case 0:
    default:
      return "info";
  }
}

/** Display metadata for a raw `FindingHumanReviewStatus` wire value; `null` when there is nothing worth surfacing. */
export type FindingHumanReviewStatusDisplay = {
  readonly label: string;
  readonly statusKind: EnterpriseStatusKind;
};

/** Normalizes numeric and OpenAPI string representations of `FindingHumanReviewStatus`. */
export function normalizeFindingHumanReviewStatus(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  switch (trimmed.toLowerCase()) {
    case "notrequired":
      return 0;
    case "pending":
      return 1;
    case "approved":
      return 2;
    case "rejected":
      return 3;
    case "overridden":
      return 4;
    default: {
      const numeric = Number(trimmed);
      return Number.isFinite(numeric) ? Math.trunc(numeric) : null;
    }
  }
}

/**
 * Maps the raw `FindingHumanReviewStatus` enum (0=NotRequired, 1=Pending, 2=Approved, 3=Rejected, 4=Overridden)
 * to a display label + status-tag kind. `NotRequired` and unrecognized values return `null` so the default
 * (most common) case renders no badge instead of a noisy "Not required" tag on every finding.
 */
export function humanReviewStatusDisplay(
  value: number | null | undefined,
): FindingHumanReviewStatusDisplay | null {
  switch (value) {
    case 1:
      return { label: "Pending review", statusKind: "needs-attention" };
    case 2:
      return { label: "Approved", statusKind: "approved" };
    case 3:
      return { label: "Rejected", statusKind: "blocked" };
    case 4:
      return { label: "Overridden", statusKind: "in-progress" };
    default:
      return null;
  }
}

function normalizedSeverity(severityValue: number): number {
  if (!Number.isFinite(severityValue)) {
    return 0;
  }

  const n = Math.trunc(severityValue);

  if (n < 0) {
    return 0;
  }

  if (n > 3) {
    return 3;
  }

  return n;
}

export function coerceArchitectureFindingSeverity(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return normalizedSeverity(raw);
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();

    if (trimmed.length === 0) {
      return 0;
    }

    const parsed = Number.parseInt(trimmed, 10);

    if (!Number.isNaN(parsed)) {
      return normalizedSeverity(parsed);
    }

    // Authority run detail emits ArchitectureFinding.Severity as enum names (see ArchitectureFindingJsonConverter).
    switch (trimmed.toLowerCase()) {
      case "critical":
        return 3;

      case "error":
      case "high":
        return 2;

      case "warning":
      case "medium":
        return 1;

      case "info":
      case "informational":
      case "low":
        return 0;

      default:
        return 0;
    }
  }

  return 0;
}
