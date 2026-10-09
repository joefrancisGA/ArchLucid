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

export function severityBadgeLabel(severityValue: number | null | undefined): string {
  if (severityValue == null) {
    return "Severity was not stored";
  }

  switch (severityValue) {
    case 3:
      return "Critical";
    case 2:
      return "High";
    case 1:
      return "Medium";
    case 0:
      return "Info";
    default:
      return "Severity unknown";
  }
}

/** Maps numeric quick-decision severity to SeverityTag kind. */
export function severityKindFromNumericValue(severityValue: number | null | undefined): FindingSeverityKind {
  if (severityValue == null) {
    return "unknown";
  }

  switch (severityValue) {
    case 3:
      return "critical";

    case 2:
      return "high";

    case 1:
      return "medium";

    case 0:
      return "info";

    default:
      return "unknown";
  }
}

export function compareFindingSeverity(
  left: number | null,
  right: number | null,
  order: "ascending" | "descending" = "descending",
): number {
  if (left === null) {
    return right === null ? 0 : 1;
  }

  if (right === null) {
    return -1;
  }

  return order === "ascending" ? left - right : right - left;
}

export function hasFindingSeverityAtLeast(severityValue: number | null, minimum: number): boolean {
  return severityValue !== null && severityValue >= minimum;
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
 * Maps the raw `FindingHumanReviewStatus` enum to a display label + status-tag kind.
 */
export function humanReviewStatusDisplay(
  value: number | null | undefined,
): FindingHumanReviewStatusDisplay {
  switch (value) {
    case 0:
      return { label: "No human review required", statusKind: "neutral" };
    case 1:
      return { label: "Pending review", statusKind: "needs-attention" };
    case 2:
      return { label: "Approved", statusKind: "approved" };
    case 3:
      return { label: "Rejected", statusKind: "blocked" };
    case 4:
      return { label: "Overridden", statusKind: "in-progress" };
    case null:
    case undefined:
      return { label: "Human review status was not stored", statusKind: "neutral" };
    default:
      return { label: "Human review status unknown", statusKind: "neutral" };
  }
}

function normalizedSeverity(severityValue: number): number | null {
  if (!Number.isFinite(severityValue)) {
    return null;
  }

  const n = Math.trunc(severityValue);

  if (n < 0) {
    return n;
  }

  return n;
}

export function coerceArchitectureFindingSeverity(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return normalizedSeverity(raw);
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();

    if (trimmed.length === 0) {
      return null;
    }

    const parsed = /^-?\d+$/.test(trimmed) ? Number.parseInt(trimmed, 10) : Number.NaN;

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
        return null;
    }
  }

  return null;
}
