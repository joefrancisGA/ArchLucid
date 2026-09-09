import type { components } from "@/lib/openapi-schemas";

type FindingHumanReviewStatus = components["schemas"]["FindingHumanReviewStatus"];
type FindingDisposition = components["schemas"]["FindingDisposition"];

export const FINDING_HUMAN_REVIEW_DISPOSITION_DIVERGENCE_BANNER =
  "ITSM queue state and the current disposition trail disagree. Reload inspect and reconcile before export or sponsor handoff.";

export const FINDING_HUMAN_REVIEW_DISPOSITION_DIVERGENCE_EXPORT_SUFFIX =
  " (diverged from disposition trail)";

export type FindingHumanReviewDispositionDivergenceInput = {
  readonly humanReviewStatus?: FindingHumanReviewStatus | number | string | null;
  readonly latestDisposition?: FindingDisposition | null;
  readonly latestDispositionRowVersionBase64?: string | null;
};

export type FindingHumanReviewDispositionDivergence = {
  readonly isDiverged: boolean;
  readonly reason: string | null;
};

function normalizeHumanReviewStatus(
  value: FindingHumanReviewStatus | number | string | null | undefined,
): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    switch (value.trim()) {
      case "NotRequired":
        return 0;
      case "Pending":
        return 1;
      case "Approved":
        return 2;
      case "Rejected":
        return 3;
      case "Overridden":
        return 4;
      default:
        return Number.parseInt(value, 10);
    }
  }

  return null;
}

function isCompatibleDisposition(
  humanReviewStatus: number,
  latestDisposition: FindingDisposition,
): boolean {
  switch (humanReviewStatus) {
    case 2:
      return latestDisposition === "Remediated" || latestDisposition === "Accepted";
    case 3:
      return latestDisposition !== "Accepted" && latestDisposition !== "Remediated";
    case 4:
      return latestDisposition === "Accepted";
    case 1:
      return (
        latestDisposition === "Deferred"
        || latestDisposition === "NeedsEvidence"
        || latestDisposition === "Accepted"
      );
    default:
      return true;
  }
}

/** LP-17 / ADR 0076: fail-closed when CAS pointer exists and ITSM queue state disagrees with current disposition. */
export function resolveFindingHumanReviewDispositionDivergence(
  input: FindingHumanReviewDispositionDivergenceInput,
): FindingHumanReviewDispositionDivergence {
  const hasCurrentPointer =
    typeof input.latestDispositionRowVersionBase64 === "string"
    && input.latestDispositionRowVersionBase64.trim().length > 0;

  return resolveFindingHumanReviewDispositionDivergenceWithPointer(
    input.humanReviewStatus,
    input.latestDisposition,
    hasCurrentPointer,
  );
}

export function resolveFindingHumanReviewDispositionDivergenceWithPointer(
  humanReviewStatus: FindingHumanReviewStatus | number | string | null | undefined,
  latestDisposition: FindingDisposition | null | undefined,
  hasCurrentDispositionPointer: boolean,
): FindingHumanReviewDispositionDivergence {
  if (!hasCurrentDispositionPointer || latestDisposition == null) {
    return { isDiverged: false, reason: null };
  }

  const normalizedStatus = normalizeHumanReviewStatus(humanReviewStatus);

  if (normalizedStatus === null || normalizedStatus === 0) {
    return { isDiverged: false, reason: null };
  }

  if (normalizedStatus !== 2 && normalizedStatus !== 3 && normalizedStatus !== 4) {
    return { isDiverged: false, reason: null };
  }

  if (isCompatibleDisposition(normalizedStatus, latestDisposition)) {
    return { isDiverged: false, reason: null };
  }

  return {
    isDiverged: true,
    reason: `ITSM queue state (${humanReviewStatusLabel(normalizedStatus)}) does not match current disposition (${latestDisposition}).`,
  };
}

function humanReviewStatusLabel(status: number): string {
  switch (status) {
    case 2:
      return "approved";
    case 3:
      return "rejected";
    case 4:
      return "overridden";
    default:
      return "pending";
  }
}

export function formatHumanReviewStatusForExportWithDivergenceHonesty(
  humanReviewStatusLabel: string,
  divergence: FindingHumanReviewDispositionDivergence,
): string {
  if (!divergence.isDiverged || humanReviewStatusLabel.length === 0) {
    return humanReviewStatusLabel;
  }

  return `${humanReviewStatusLabel}${FINDING_HUMAN_REVIEW_DISPOSITION_DIVERGENCE_EXPORT_SUFFIX}`;
}
