import Link from "next/link";
import type { ReactElement } from "react";

import { BUYER_SPONSOR_SUMMARY_VOCABULARY, BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import { MARKETING_CAPTION_TEXT_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import { cn } from "@/lib/utils";

export type ShowcaseOutcomeStripProps = {
  runId: string;
  manifestId: string | null | undefined;
  /** When set (demo spine), adds a direct finding deep-link card */
  primaryFindingId?: string | null | undefined;
  /**
   * When false, omit authenticated `/architecture/reviews/...` deep links (use manifest-only CTAs). Public marketing surfaces pass
   * {@link import("@/lib/operator/operator-static-demo").isStaticDemoPayloadFallbackEnabled} from a server parent.
   */
  readonly isRunDetailAvailable?: boolean;
  /** Public demo / marketing preview — soften deliverable copy so it is not read as a live customer outcome. */
  readonly illustrativeSample?: boolean;
};

/**
 * Primary CTAs for the public showcase — deep-links into operator routes used by the mock / pilot flows.
 */
export function ShowcaseOutcomeStrip(props: ShowcaseOutcomeStripProps): ReactElement {
  const { runId, manifestId, primaryFindingId, isRunDetailAvailable = true, illustrativeSample = false } = props;
  const governanceSubtitle = illustrativeSample
    ? "Sample deliverables — illustrative only"
    : "Board-ready & audit-ready deliverables";
  const encRun = encodeURIComponent(runId);
  const hasManifest = typeof manifestId === "string" && manifestId.trim().length > 0;
  const encFinding =
    typeof primaryFindingId === "string" && primaryFindingId.trim().length > 0
      ? encodeURIComponent(primaryFindingId.trim())
      : null;

  const cardClass =
    "flex flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-4 no-underline shadow-sm transition hover:border-teal-600/40 hover:shadow dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-teal-400/40";

  const disabledCardClass = cn(
    cardClass,
    "pointer-events-none cursor-not-allowed border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/50",
  );

  const outcomeCaptionClass = cn(OPERATOR_TYPOGRAPHY.helper, MARKETING_CAPTION_TEXT_CLASS);

  const encManifest = hasManifest ? encodeURIComponent(manifestId.trim()) : "";

  return (
    <section aria-label="Open completed output" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {isRunDetailAvailable ? (
        <Link className={cardClass} href={`/architecture/reviews/${encRun}`}>
          <span className={cn("font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {`1 · ${BUYER_SPONSOR_SUMMARY_VOCABULARY.reviewSponsorReportLabel}`}
          </span>
          <span className={outcomeCaptionClass}>Decision, evidence, and audit package</span>
        </Link>
      ) : (
        <div className={disabledCardClass}>
          <span className={cn("font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {`1 · ${BUYER_SPONSOR_SUMMARY_VOCABULARY.reviewSponsorReportLabel}`}
          </span>
          <span className={outcomeCaptionClass}>
            Sign in with a connected workspace to open the sponsor report and finalized review record.
          </span>
        </div>
      )}

      {hasManifest ? (
        <Link className={cardClass} href={signedRecordDetailPath(encManifest)}>
          <span className={cn("font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>{`2 · ${SIGNED_MANIFEST_LABEL}`}</span>
          <span className={outcomeCaptionClass}>Signed architecture record and deliverables index</span>
        </Link>
      ) : (
        <div className={disabledCardClass}>
          <span className={cn("font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>{`2 · ${SIGNED_MANIFEST_LABEL}`}</span>
          <span className={outcomeCaptionClass}>Unavailable for this preview</span>
        </div>
      )}

      {isRunDetailAvailable ? (
        <Link className={cardClass} href={`/insights/evidence-graph?runId=${encRun}`}>
          <span className={cn("font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {`3 · ${BUYER_SURFACE_VOCABULARY.evidenceGraphNav}`}
          </span>
          <span className={outcomeCaptionClass}>Traceability from evidence to decisions</span>
        </Link>
      ) : hasManifest ? (
        <Link className={cardClass} href={signedRecordDetailPath(encManifest)}>
          <span className={cn("font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {`3 · ${BUYER_SURFACE_VOCABULARY.evidenceGraphNav}`}
          </span>
          <span className={outcomeCaptionClass}>See summarized posture on the finalized review record</span>
        </Link>
      ) : (
        <div className={disabledCardClass}>
          <span className={cn("font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {`3 · ${BUYER_SURFACE_VOCABULARY.evidenceGraphNav}`}
          </span>
          <span className={outcomeCaptionClass}>Unavailable for this preview</span>
        </div>
      )}

      {isRunDetailAvailable ? (
        <Link className={cardClass} href={`/governance/approval-queue?runId=${encRun}`}>
          <span className={cn("font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>4 · Resolve outcomes</span>
          <span className={outcomeCaptionClass}>{governanceSubtitle}</span>
        </Link>
      ) : hasManifest ? (
        <Link className={cardClass} href={signedRecordDetailPath(encManifest)}>
          <span className={cn("font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>4 · Resolve outcomes</span>
          <span className={outcomeCaptionClass}>{governanceSubtitle}</span>
        </Link>
      ) : (
        <div className={disabledCardClass}>
          <span className={cn("font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>4 · Resolve outcomes</span>
          <span className={outcomeCaptionClass}>Unavailable for this preview</span>
        </div>
      )}

      {encFinding !== null ? (
        isRunDetailAvailable ? (
          <Link className={cardClass} href={auditTrailNavHref(runId)}>
            <span className={cn("font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {`5 · ${BUYER_SURFACE_VOCABULARY.auditTrail}`}
            </span>
            <span className={outcomeCaptionClass}>Recorded lifecycle events for this review</span>
          </Link>
        ) : hasManifest ? (
          <Link className={cardClass} href={signedRecordDetailPath(encManifest)}>
            <span className={cn("font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {`5 · ${BUYER_SURFACE_VOCABULARY.auditTrail}`}
            </span>
            <span className={outcomeCaptionClass}>PHI minimization posture — see related items in the finalized review record</span>
          </Link>
        ) : (
          <div className={disabledCardClass}>
            <span className={cn("font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {`5 · ${BUYER_SURFACE_VOCABULARY.auditTrail}`}
            </span>
            <span className={outcomeCaptionClass}>Unavailable for this preview</span>
          </div>
        )
      ) : null}
    </section>
  );
}
