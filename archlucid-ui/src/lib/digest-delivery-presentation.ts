import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { ArchitectureDigest } from "@/types/advisory-scheduling";
import type { DigestDeliveryAttempt } from "@/types/digest-subscriptions";

/** Delivery state rendered as a {@link StatusTag} on digest history and detail. */
export type DigestDeliveryStatusView = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

export const DIGEST_DELIVERY_NOT_DELIVERED: DigestDeliveryStatusView = {
  kind: "draft",
  label: "Not delivered",
};

export const DIGEST_DELIVERY_DELIVERED: DigestDeliveryStatusView = {
  kind: "ready",
  label: "Delivered",
};

export const DIGEST_DELIVERY_FAILED: DigestDeliveryStatusView = {
  kind: "blocked",
  label: "Delivery failed",
};

export const DIGEST_DELIVERY_PARTIAL: DigestDeliveryStatusView = {
  kind: "needs-attention",
  label: "Partial delivery",
};

export const DIGEST_DELIVERY_IN_PROGRESS: DigestDeliveryStatusView = {
  kind: "in-progress",
  label: "In progress",
};

/**
 * Buyer-safe stand-in for a recorded delivery diagnostic.
 *
 * `DigestDeliveryDispatcher` stores the raw `Exception.Message` in
 * `errorMessage` (for example `smtp timeout`), so the string is never safe to
 * present as product copy. The raw value stays available under Technical details.
 */
export const DIGEST_DELIVERY_DIAGNOSTIC_NOTE =
  "A diagnostic was recorded for this attempt. Open Technical details to review it." as const;

const SUCCESS_STATUS = /^succeeded$|success|delivered|^sent$|^ok$/i;
const FAILURE_STATUS = /fail|error/i;
const IN_FLIGHT_STATUS = /^started$|pending|queue|progress|retry/i;

/** Maps one attempt's backend status string to canonical delivery vocabulary. */
export function resolveDigestDeliveryAttemptStatus(
  attempt: DigestDeliveryAttempt,
): DigestDeliveryStatusView {
  const status: string = attempt.status?.trim() ?? "";

  if (FAILURE_STATUS.test(status)) {
    return DIGEST_DELIVERY_FAILED;
  }

  if (SUCCESS_STATUS.test(status)) {
    return DIGEST_DELIVERY_DELIVERED;
  }

  if (IN_FLIGHT_STATUS.test(status)) {
    return DIGEST_DELIVERY_IN_PROGRESS;
  }

  return DIGEST_DELIVERY_NOT_DELIVERED;
}

/** Aggregates every attempt for one digest into a single row-level status. */
export function resolveDigestDeliveryStatus(
  attempts: readonly DigestDeliveryAttempt[],
): DigestDeliveryStatusView {
  if (attempts.length === 0) {
    return DIGEST_DELIVERY_NOT_DELIVERED;
  }

  const views: readonly DigestDeliveryStatusView[] = attempts.map(resolveDigestDeliveryAttemptStatus);
  const hasFailure: boolean = views.some((view) => view.label === DIGEST_DELIVERY_FAILED.label);
  const hasSuccess: boolean = views.some((view) => view.label === DIGEST_DELIVERY_DELIVERED.label);

  if (hasFailure && hasSuccess) {
    return DIGEST_DELIVERY_PARTIAL;
  }

  if (hasFailure) {
    return DIGEST_DELIVERY_FAILED;
  }

  if (hasSuccess) {
    return DIGEST_DELIVERY_DELIVERED;
  }

  return DIGEST_DELIVERY_IN_PROGRESS;
}

/** True when the attempt carries a recorded diagnostic worth disclosing. */
export function digestDeliveryAttemptHasDiagnostic(attempt: DigestDeliveryAttempt): boolean {
  return (attempt.errorMessage?.trim() ?? "") !== "";
}

/** Raw diagnostic lines for the Technical details disclosure only. */
export function digestDeliveryDiagnostics(
  attempts: readonly DigestDeliveryAttempt[],
): readonly string[] {
  return attempts
    .filter(digestDeliveryAttemptHasDiagnostic)
    .map((attempt) => `${attempt.attemptId}: ${attempt.errorMessage?.trim() ?? ""}`);
}

/** Downloadable digest file — extension and MIME both match the Markdown body. */
export type DigestExportFile = {
  readonly fileName: string;
  readonly mimeType: string;
  readonly contents: string;
};

export const DIGEST_EXPORT_MIME_TYPE = "text/markdown;charset=utf-8" as const;

export const DIGEST_EXPORT_ACTION_LABEL = "Download Markdown" as const;

const EXPORT_FILE_STEM_MAX_LENGTH = 64;

/**
 * Builds the export descriptor for a digest. `contentMarkdown` is Markdown, so
 * the file is `.md` with a matching MIME type rather than a `.txt` mislabel.
 */
export function buildDigestExportFile(digest: ArchitectureDigest): DigestExportFile {
  // Trim separator runs so a punctuation-only title yields "digest", not "_".
  const slug: string = (digest.title ?? "")
    .replace(/[^\w\-]+/g, "_")
    .replace(/^[_-]+|[_-]+$/g, "")
    .slice(0, EXPORT_FILE_STEM_MAX_LENGTH);
  const stem: string = slug === "" ? "digest" : slug;

  return {
    fileName: `${stem}.md`,
    mimeType: DIGEST_EXPORT_MIME_TYPE,
    contents: digest.contentMarkdown ?? "",
  };
}
