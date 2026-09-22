import {
  resolveDigestBodyDisclaimer,
  resolveDigestRowLabel,
  resolveDigestSubjectPrefix,
  DIGEST_REHEARSAL_BODY_DISCLAIMER,
  DIGEST_REHEARSAL_SUBJECT_PREFIX,
} from "@/lib/digest/digest-career-honesty";
import {
  resolveRunStatusBadgeWorkingCareerHonestyCell,
  type RunStatusBadgeWorkingCareerHonestyInput,
} from "@/lib/runs/run-status-badge-career-honesty";

/** CG-038 — ITSM outbound honesty when the finding run is not Career + Real. */
export const ITSM_OUTBOUND_REHEARSAL_SUMMARY_PREFIX = DIGEST_REHEARSAL_SUBJECT_PREFIX;

export const ITSM_OUTBOUND_REHEARSAL_BODY_DISCLAIMER = DIGEST_REHEARSAL_BODY_DISCLAIMER;

export type ItsmOutboundCareerHonestyPresentation = {
  readonly rowLabel: string;
  readonly summaryPrefix: string;
  readonly bodyDisclaimer: string;
};

export function resolveItsmOutboundCareerHonesty(
  input: RunStatusBadgeWorkingCareerHonestyInput & {
    readonly isSample?: boolean | null;
  },
): ItsmOutboundCareerHonestyPresentation | null {
  const row = resolveDigestRowLabel(input);

  if (row === null) {
    return null;
  }

  const requiresHonesty = resolveRunStatusBadgeWorkingCareerHonestyCell(input) !== "career-real";

  return {
    rowLabel: row.rowLabel,
    summaryPrefix: requiresHonesty ? resolveDigestSubjectPrefix({ committedRunRequiresHonesty: [true] }) : "",
    bodyDisclaimer:
      requiresHonesty
        ? (resolveDigestBodyDisclaimer({ committedRunRequiresHonesty: [true] }) ??
          ITSM_OUTBOUND_REHEARSAL_BODY_DISCLAIMER)
        : "",
  };
}
