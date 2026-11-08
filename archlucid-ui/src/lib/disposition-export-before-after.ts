import type { FindingDispositionKind } from "@/lib/api/governance-stickiness-api";
import {
  DISPOSITION_EXPORT_IMPACT_SPONSOR_ROI_SECTION_HEADING,
  dispositionExportSponsorRoiBucketLabel,
} from "@/lib/disposition-export-impact";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";

/** Pre-disposition ROI line in SponsorReviewPacketComposer. */
export const DISPOSITION_EXPORT_BEFORE_OPEN_ROI_BUCKET = "Open (estimated potential)";

export const DISPOSITION_EXPORT_SIGNED_RECORD_BEFORE_FINALIZE_LINE =
  `${SIGNED_MANIFEST_LABEL}: open review — findings are not sealed until you finalize the architecture package` as const;

export const DISPOSITION_EXPORT_SIGNED_RECORD_AFTER_UNCHANGED_LINE =
  `${SIGNED_MANIFEST_LABEL}: unchanged — committed snapshot is not rewritten` as const;

export const DISPOSITION_EXPORT_DOES_NOT_FINALIZE_LINE =
  "Recording a disposition does not finalize the architecture package." as const;

export const DISPOSITION_EXPORT_FINDING_TITLE_NOT_STORED = "Finding title was not stored." as const;

export const DISPOSITION_EXPORT_DISPOSITION_NOT_STORED = "Disposition was not stored." as const;

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

function dispositionExportFindingTitle(findingTitle: string | null | undefined): string {
  const trimmed = findingTitle?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : DISPOSITION_EXPORT_FINDING_TITLE_NOT_STORED;
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
    return `Finding: ${title} — ${DISPOSITION_EXPORT_DISPOSITION_NOT_STORED}`;
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
  const title = dispositionExportFindingTitle(input.findingTitle);
  const afterBucket = dispositionExportSponsorRoiBucketLabel(input.disposition);
  const beforeBucket = beforeRoiBucketLabel(input.currentDisposition);

  const beforeLines = buildPacketSnippetLines({
    signedRecordLine: DISPOSITION_EXPORT_SIGNED_RECORD_BEFORE_FINALIZE_LINE,
    findingStatusLine: beforeFindingStatusLine(title, input.currentDisposition),
    roiBucketLine: `- ${beforeBucket}: projected impact stays in this ROI bucket until you confirm`,
    topFindingsLine:
      "Top findings: may list this finding by severity (disposition alone does not remove the row)",
    auditTrailLine: `Audit trail: no new disposition event from this action yet — ${DISPOSITION_EXPORT_DOES_NOT_FINALIZE_LINE}`,
  });

  const afterLines = buildPacketSnippetLines({
    signedRecordLine: DISPOSITION_EXPORT_SIGNED_RECORD_AFTER_UNCHANGED_LINE,
    findingStatusLine: `Finding: ${title} — ${dispositionLabel}`,
    roiBucketLine: `- ${afterBucket}: projected impact moves to this ROI bucket after confirm`,
    topFindingsLine:
      "Top findings: may still list this finding by severity (disposition alone does not remove the row)",
    auditTrailLine: `Audit trail: appends disposition event (${dispositionLabel}) — ${DISPOSITION_EXPORT_DOES_NOT_FINALIZE_LINE}`,
  });

  return {
    beforeLines,
    afterLines,
    dispositionLabel,
  };
}
