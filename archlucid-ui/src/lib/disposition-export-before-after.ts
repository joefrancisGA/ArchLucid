import type { FindingDispositionKind } from "@/lib/api/governance-stickiness-api";
import {
  DISPOSITION_EXPORT_IMPACT_SPONSOR_ROI_SECTION_HEADING,
  dispositionExportSponsorRoiBucketLabel,
} from "@/lib/disposition-export-impact";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";

/** Pre-disposition ROI line in SponsorReviewPacketComposer. */
export const DISPOSITION_EXPORT_BEFORE_OPEN_ROI_BUCKET = "Open (estimated potential)";

export type DispositionExportBeforeAfterInput = {
  readonly disposition: FindingDispositionKind;
  /** Optional finding title for packet-snippet realism. */
  readonly findingTitle?: string | null;
  /**
   * Current disposition before confirm.
   * When omitted or null, before-state treats the finding as still Open.
   */
  readonly currentDisposition?: FindingDispositionKind | null;
};

export type DispositionExportBeforeAfter = {
  readonly beforeLines: string[];
  readonly afterLines: string[];
  readonly dispositionLabel: string;
};

/** Buyer-facing disposition label for confirm + packet preview (TB-2193). */
export function findingDispositionKindLabel(disposition: FindingDispositionKind): string {
  switch (disposition) {
    case "Accepted":
      return "Accepted";
    case "RejectedAsNotApplicable":
      return "Rejected (not applicable)";
    case "Deferred":
      return "Deferred";
    case "NeedsEvidence":
      return "Needs evidence";
    case "Remediated":
      return "Remediated";
    default: {
      const exhaustive: never = disposition;
      return exhaustive;
    }
  }
}

function nonEmptyTitle(findingTitle: string | null | undefined): string {
  const trimmed = findingTitle?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : "Selected finding";
}

function beforeRoiBucketLabel(currentDisposition: FindingDispositionKind | null | undefined): string {
  if (currentDisposition == null) {
    return DISPOSITION_EXPORT_BEFORE_OPEN_ROI_BUCKET;
  }

  return dispositionExportSponsorRoiBucketLabel(currentDisposition);
}

function beforeFindingStatusLine(
  title: string,
  currentDisposition: FindingDispositionKind | null | undefined,
): string {
  if (currentDisposition == null) {
    return `Finding: ${title} — Open (awaiting disposition)`;
  }

  return `Finding: ${title} — ${findingDispositionKindLabel(currentDisposition)}`;
}

function buildPacketSnippetLines(args: {
  readonly findingStatusLine: string;
  readonly signedRecordLine: string;
  readonly roiBucketLine: string;
  readonly topFindingsLine: string;
  readonly auditTrailLine: string;
}): string[] {
  return [
    args.signedRecordLine,
    args.findingStatusLine,
    `## ${DISPOSITION_EXPORT_IMPACT_SPONSOR_ROI_SECTION_HEADING}`,
    args.roiBucketLine,
    args.topFindingsLine,
    args.auditTrailLine,
  ];
}

/**
 * Side-by-side packet wording for disposition confirm (TB-2193).
 * Before = current sponsor / signed-record snippet; After = post-disposition wording.
 */
export function buildDispositionExportBeforeAfter(
  input: DispositionExportBeforeAfterInput,
): DispositionExportBeforeAfter {
  const dispositionLabel = findingDispositionKindLabel(input.disposition);
  const title = nonEmptyTitle(input.findingTitle);
  const afterBucket = dispositionExportSponsorRoiBucketLabel(input.disposition);
  const beforeBucket = beforeRoiBucketLabel(input.currentDisposition);

  const beforeLines = buildPacketSnippetLines({
    signedRecordLine:
      `${SIGNED_MANIFEST_LABEL}: committed snapshot (findings as recorded at finalize)`,
    findingStatusLine: beforeFindingStatusLine(title, input.currentDisposition),
    roiBucketLine: `- ${beforeBucket}: includes this finding's projected impact`,
    topFindingsLine:
      "Top findings: may list this finding by severity (disposition alone does not remove the row)",
    auditTrailLine: "Audit trail: no new disposition event from this action yet",
  });

  const afterLines = buildPacketSnippetLines({
    signedRecordLine:
      `${SIGNED_MANIFEST_LABEL}: unchanged — committed snapshot is not rewritten`,
    findingStatusLine: `Finding: ${title} — ${dispositionLabel}`,
    roiBucketLine: `- ${afterBucket}: includes this finding's projected impact`,
    topFindingsLine:
      "Top findings: may still list this finding by severity (disposition alone does not remove the row)",
    auditTrailLine: `Audit trail: appends disposition event (${dispositionLabel})`,
  });

  return {
    beforeLines,
    afterLines,
    dispositionLabel,
  };
}
