import Link from "next/link";
import type { ReactElement } from "react";

import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY, BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

export type ShowcaseOutcomeStripProps = {
  runId: string;
  manifestId: string | null | undefined;
  /** When set (demo spine), adds a direct finding deep-link card */
  primaryFindingId?: string | null | undefined;
  /**
   * When false, omit authenticated `/reviews/...` deep links (use manifest-only CTAs). Public marketing surfaces pass
   * {@link import("@/lib/operator-static-demo").isStaticDemoPayloadFallbackEnabled} from a server parent.
   */
  readonly isRunDetailAvailable?: boolean;
};

/**
 * Primary CTAs for the public showcase — deep-links into operator routes used by the mock / pilot flows.
 */
export function ShowcaseOutcomeStrip(props: ShowcaseOutcomeStripProps): ReactElement {
  const { runId, manifestId, primaryFindingId, isRunDetailAvailable = true } = props;
  const encRun = encodeURIComponent(runId);
  const hasManifest = typeof manifestId === "string" && manifestId.trim().length > 0;
  const encFinding =
    typeof primaryFindingId === "string" && primaryFindingId.trim().length > 0
      ? encodeURIComponent(primaryFindingId.trim())
      : null;

  const cardClass =
    "flex flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-4 no-underline shadow-sm transition hover:border-teal-600/40 hover:shadow dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-teal-400/40";

  const encManifest = hasManifest ? encodeURIComponent(manifestId.trim()) : "";

  return (
    <section aria-label="Open completed output" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {isRunDetailAvailable ? (
        <Link className={cardClass} href={`/reviews/${encRun}`}>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {`1 · ${BUYER_EXECUTIVE_SUMMARY_VOCABULARY.pageTitle}`}
          </span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Decision, evidence, and audit package</span>
        </Link>
      ) : (
        <div className={`${cardClass} pointer-events-none cursor-not-allowed opacity-60`}>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {`1 · ${BUYER_EXECUTIVE_SUMMARY_VOCABULARY.pageTitle}`}
          </span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">
            Sign in with a connected workspace to open the executive summary and finalized signed record.
          </span>
        </div>
      )}

      {hasManifest ? (
        <Link className={cardClass} href={`/manifests/${encManifest}`}>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">2 · Signed manifest</span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Signed architecture record and deliverables index</span>
        </Link>
      ) : (
        <div className={`${cardClass} pointer-events-none cursor-not-allowed opacity-60`}>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">2 · Signed manifest</span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Unavailable for this preview</span>
        </div>
      )}

      {isRunDetailAvailable ? (
        <Link className={cardClass} href={`/graph?runId=${encRun}`}>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {`3 · ${BUYER_SURFACE_VOCABULARY.evidenceGraphNav}`}
          </span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Traceability from evidence to decisions</span>
        </Link>
      ) : hasManifest ? (
        <Link className={cardClass} href={`/manifests/${encManifest}`}>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {`3 · ${BUYER_SURFACE_VOCABULARY.evidenceGraphNav}`}
          </span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">See summarized posture on the finalized signed manifest</span>
        </Link>
      ) : (
        <div className={`${cardClass} pointer-events-none cursor-not-allowed opacity-60`}>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {`3 · ${BUYER_SURFACE_VOCABULARY.evidenceGraphNav}`}
          </span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Unavailable for this preview</span>
        </div>
      )}

      {isRunDetailAvailable ? (
        <Link className={cardClass} href={`/governance?runId=${encRun}`}>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">4 · Governance approval</span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Board-ready &amp; audit-ready deliverables</span>
        </Link>
      ) : hasManifest ? (
        <Link className={cardClass} href={`/manifests/${encManifest}`}>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">4 · Governance approval</span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Deliverables on the finalized signed manifest</span>
        </Link>
      ) : (
        <div className={`${cardClass} pointer-events-none cursor-not-allowed opacity-60`}>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">4 · Governance approval</span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Unavailable for this preview</span>
        </div>
      )}

      {encFinding !== null ? (
        isRunDetailAvailable ? (
          <Link className={cardClass} href={`/audit?runId=${encRun}`}>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              {`5 · ${BUYER_SURFACE_VOCABULARY.auditTrail}`}
            </span>
            <span className="text-xs text-neutral-600 dark:text-neutral-400">Recorded lifecycle events for this review</span>
          </Link>
        ) : hasManifest ? (
          <Link className={cardClass} href={`/manifests/${encManifest}`}>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              {`5 · ${BUYER_SURFACE_VOCABULARY.auditTrail}`}
            </span>
            <span className="text-xs text-neutral-600 dark:text-neutral-400">PHI minimization posture — see related items in the manifest</span>
          </Link>
        ) : (
          <div className={`${cardClass} pointer-events-none cursor-not-allowed opacity-60`}>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              {`5 · ${BUYER_SURFACE_VOCABULARY.auditTrail}`}
            </span>
            <span className="text-xs text-neutral-600 dark:text-neutral-400">Unavailable for this preview</span>
          </div>
        )
      ) : null}
    </section>
  );
}
