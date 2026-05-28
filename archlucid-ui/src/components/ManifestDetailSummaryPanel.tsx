import Link from "next/link";
import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import { Button } from "@/components/ui/button";
import { getBundleDownloadUrl } from "@/lib/api";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { manifestStatusForDisplay } from "@/lib/manifest-status-display";
import { BUYER_MANIFEST_BUNDLE_DOWNLOAD_DETAILS_SUMMARY, BUYER_MANIFEST_BUNDLE_DOWNLOAD_ZIP_NOTE } from "@/lib/buyer-polish-copy";
import { policyPackBuyerGovernanceDetailHref, policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import {
  SHOWCASE_STATIC_DEMO_AUDIT_TRAIL_EVENT_COUNT,
  SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES,
  SHOWCASE_STATIC_DEMO_GRAPH_LINKED_RECORD_COUNT,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_WARNING_SYNOPSES,
} from "@/lib/showcase-static-demo";
import type { ManifestSummary } from "@/types/authority";

export type ManifestDetailSummaryPanelProps = {
  readonly summary: ManifestSummary;
  /**
   * When true (buyer/demo builds): lead with conclusions and narratives; keep count tiles beneath; collapse identifiers.
   */
  readonly buyerPolishedLayout?: boolean;
  /** When false, bundle download renders elsewhere on the page (buyer manifest detail). */
  readonly includeBundleDownload?: boolean;
};

/**
 * Manifest summary: metric tiles plus expandable decisions/warnings when we have curated demo copy or counts only.
 */
export function ManifestDetailSummaryPanel(props: ManifestDetailSummaryPanelProps) {
  const { summary, buyerPolishedLayout, includeBundleDownload = true } = props;
  const isCuratedDemo = summary.manifestId === SHOWCASE_STATIC_DEMO_MANIFEST_ID;
  const decisionLinesAll = isCuratedDemo ? [...SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES] : [];
  const decisionLinesPreview = decisionLinesAll.slice(0, 3);
  const decisionRestCount = Math.max(0, decisionLinesAll.length - decisionLinesPreview.length);
  const warningLines = isCuratedDemo ? [...SHOWCASE_STATIC_DEMO_WARNING_SYNOPSES] : [];
  const detailOpenDefault = !(buyerPolishedLayout ?? false) || isCuratedDemo;

  const operatorSummary =
    summary.operatorSummary ? (
      <div className="rounded-lg border border-teal-100 bg-teal-50/60 px-4 py-3 dark:border-teal-900/40 dark:bg-teal-950/30">
        <p className="m-0 text-sm font-medium leading-relaxed text-teal-900 dark:text-teal-100">
          {summary.operatorSummary}
        </p>
      </div>
    ) : null;

  const countsGrid =
    buyerPolishedLayout ?? false ? (
      <div className="space-y-2">
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
          At a glance
        </p>
        {countsGridTiles(summary, { buyerPolishedLayout: true })}
      </div>
    ) : (
      countsGridTiles(summary, { buyerPolishedLayout: false })
    );

  const policyLine = (
    <p className="m-0 text-sm text-neutral-700 dark:text-neutral-300">
      <span className="font-medium text-neutral-800 dark:text-neutral-200">Policy pack:</span>{" "}
      {policyPackBuyerLabel(summary.ruleSetId, summary.ruleSetVersion)}
    </p>
  );

  const buyerPolicyPackHref = policyPackBuyerGovernanceDetailHref(summary.ruleSetId);

  const buyerPolicyPackCallout =
    buyerPolishedLayout ?? false ? (
      <section
        aria-labelledby="manifest-policy-pack-heading"
        data-testid="manifest-buyer-policy-pack-callout"
        className="rounded-lg border border-teal-200/90 bg-teal-50/55 p-4 dark:border-teal-900/50 dark:bg-teal-950/35"
      >
        <h3 id="manifest-policy-pack-heading" className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Policy pack — governance guardrails
        </h3>
        <p className="m-0 mt-2 text-base font-medium leading-snug text-neutral-900 dark:text-neutral-100">
          {policyPackBuyerLabel(summary.ruleSetId, summary.ruleSetVersion)}
        </p>
        <p className="m-0 mt-2 text-xs leading-snug text-neutral-600 dark:text-neutral-400">
          {isCuratedDemo
            ? "Policy pack used for this review package — defines checks referenced in diligence. Human approvals do not replace your change-management authority."
            : "Defines referenced checks used in diligence; approvals stay human-governed and do not bypass deployment authority."}
        </p>
        {buyerPolicyPackHref !== null ? (
          <p className="m-0 mt-3 text-sm">
            <Link className="font-medium text-teal-800 underline dark:text-teal-300" href={buyerPolicyPackHref}>
              View policy basis
            </Link>
          </p>
        ) : null}
      </section>
    ) : null;

  const decisionsSummaryLabel =
    buyerPolishedLayout ?? false
      ? `Decisions in this package (${summary.decisionCount})`
      : `Decisions recorded (${summary.decisionCount})`;

  const warningsSummaryLabel =
    buyerPolishedLayout ?? false
      ? `Monitored risks in this package (${summary.warningCount})`
      : `Warnings (${summary.warningCount})`;

  const decisionsBlock = (
    <details
      className="rounded-lg border border-neutral-200 dark:border-neutral-800"
      open={detailOpenDefault}
    >
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {decisionsSummaryLabel}
      </summary>
      <div className="border-t border-neutral-200 px-3 py-3 dark:border-neutral-800">
        {decisionLinesPreview.length > 0 ? (
          <ol className="m-0 list-decimal space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
            {decisionLinesPreview.map((line, index) => (
              <li key={`decision-${index}`}>{line}</li>
            ))}
          </ol>
        ) : summary.decisionCount > 0 ? (
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
            Full decision text is included in the{" "}
            <Link className="font-medium text-teal-800 underline dark:text-teal-300" href={`/reviews/${summary.runId}`}>
              governed architecture review export
            </Link>{" "}
            and evidence package — use the download actions on this page when available.
          </p>
        ) : (
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">No decisions recorded for this signed decision record.</p>
        )}
        {decisionRestCount > 0 ? (
          <p className="m-0 mt-2 text-xs text-neutral-600 dark:text-neutral-400">
            … and {decisionRestCount} more decisions in the governed export — open review detail or download the evidence
            package for the full list.
          </p>
        ) : null}
      </div>
    </details>
  );

  const warningsBlock = (
    <details
      className="rounded-lg border border-neutral-200 dark:border-neutral-800"
      open={detailOpenDefault}
    >
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {warningsSummaryLabel}
      </summary>
      <div className="border-t border-neutral-200 px-3 py-3 dark:border-neutral-800">
        {warningLines.length > 0 ? (
          <ul className="m-0 list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
            {warningLines.map((line, index) => (
              <li key={`warning-${index}`}>{line}</li>
            ))}
          </ul>
        ) : summary.warningCount > 0 ? (
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
            Monitored-risk detail travels with the governed evidence package — use{" "}
            <Link className="font-medium text-teal-800 underline dark:text-teal-300" href={`/reviews/${summary.runId}`}>
              review detail
            </Link>{" "}
            or download the bundle.
          </p>
        ) : (
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">No monitored risks recorded on this signed decision record.</p>
        )}
      </div>
    </details>
  );

  const auditIdentifiers = (
    <CollapsibleSection
      title={buyerPolishedLayout ?? false ? "Audit verification appendix" : "Verification appendix (identifiers)"}
      defaultOpen={false}
      sectionTestId="manifest-verification-appendix"
    >
      <dl className="m-0 grid gap-3 sm:grid-cols-[minmax(8rem,auto)_1fr] sm:gap-x-6">
        <dt className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Manifest ID</dt>
        <dd className="m-0 flex min-w-0 flex-wrap items-center gap-2 text-sm text-neutral-900 dark:text-neutral-100">
          <code className="min-w-0 break-all font-mono text-xs">{summary.manifestId}</code>
          <CopyIdButton value={summary.manifestId} aria-label="Copy manifest ID" />
        </dd>
        {summary.manifestHash ? (
          <>
            <dt className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Hash</dt>
            <dd className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
              <span className="font-mono text-[12px]">{summary.manifestHash}</span>
            </dd>
          </>
        ) : null}
      </dl>
    </CollapsibleSection>
  );

  const relatedFinding =
    isCuratedDemo && !(buyerPolishedLayout ?? false) ? (
      <section
        aria-labelledby="manifest-related-finding-heading"
        className="rounded-lg border border-teal-200/80 bg-teal-50/50 p-4 dark:border-teal-900/50 dark:bg-teal-950/30"
      >
        <h3
          id="manifest-related-finding-heading"
          className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100"
        >
          Related finding
        </h3>
        <p className="m-0 mt-2 text-sm text-neutral-700 dark:text-neutral-300">
          <Link
            className="font-medium text-teal-800 underline dark:text-teal-300"
            href={`/reviews/${encodeURIComponent(summary.runId)}/findings/${encodeURIComponent(SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID)}`}
          >
            PHI Minimization Risk
          </Link>
          <span className="text-neutral-600 dark:text-neutral-400"> — open the finding narrative and evidence trail.</span>
        </p>
      </section>
    ) : null;

  const buyerManifestProvesCallout =
    (buyerPolishedLayout ?? false) && isCuratedDemo ? (
      <p className="m-0 max-w-prose text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        What this signed decision record proves: a versioned decision record with enumerated outcomes, monitored risks
        under an explicit governance cadence, stable identifiers for audit correlation, and packaged deliverables wired
        to the evidence graph and audit trail.
      </p>
    ) : null;

  const buyerRecordedOutcomes =
    buyerPolishedLayout ?? false ? (
      <section aria-labelledby="manifest-buyer-recorded-heading" className="space-y-3">
        <h3
          id="manifest-buyer-recorded-heading"
          className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400"
        >
          Package summary
        </h3>
        {buyerManifestProvesCallout}
        {isCuratedDemo ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-testid="manifest-buyer-pack-summary-cards">
            <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm shadow-sm dark:border-neutral-700 dark:bg-neutral-950">
              <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Decisions recorded</p>
              <p className="m-0 mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{summary.decisionCount}</p>
              <Link
                className="m-0 mt-2 inline-block text-xs font-medium text-teal-800 underline dark:text-teal-300"
                href={buyerPolishedLayout ? "#manifest-key-decisions" : "#manifest-buyer-recorded-details"}
              >
                View decision list
              </Link>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm shadow-sm dark:border-neutral-700 dark:bg-neutral-950">
              <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Monitored risks</p>
              <p className="m-0 mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{summary.warningCount}</p>
              <p className="m-0 mt-2 text-[11px] text-neutral-600 dark:text-neutral-400">Tracked with governance cadence.</p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm shadow-sm dark:border-neutral-700 dark:bg-neutral-950">
              <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Unresolved blocking issues</p>
              <p className="m-0 mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{summary.unresolvedIssueCount}</p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm shadow-sm dark:border-neutral-700 dark:bg-neutral-950">
              <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Evidence trail anchors</p>
              <p className="m-0 mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{SHOWCASE_STATIC_DEMO_GRAPH_LINKED_RECORD_COUNT}</p>
              <Link
                href={`/graph?runId=${encodeURIComponent(canonicalizeDemoRunId(summary.runId))}`}
                className="m-0 mt-2 inline-block text-xs font-medium text-teal-800 underline dark:text-teal-300"
              >
                Explore decision traceability graph
              </Link>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm shadow-sm dark:border-neutral-700 dark:bg-neutral-950">
              <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Audit events</p>
              <p className="m-0 mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{SHOWCASE_STATIC_DEMO_AUDIT_TRAIL_EVENT_COUNT}</p>
              <Link
                href={`/audit?runId=${encodeURIComponent(canonicalizeDemoRunId(summary.runId))}`}
                className="m-0 mt-2 inline-block text-xs font-medium text-teal-800 underline dark:text-teal-300"
              >
                View audit trail
              </Link>
            </div>
          </div>
        ) : null}
        {includeBundleDownload ? (
        <details
          id="manifest-bundle-zip"
          className="scroll-mt-24 rounded-lg border border-neutral-200/90 bg-neutral-50/40 dark:border-neutral-800 dark:bg-neutral-950/30"
          data-testid="manifest-buyer-bundle-download"
        >
          <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-neutral-900 outline-none marker:text-neutral-500 focus-visible:ring-2 focus-visible:ring-teal-500/80 dark:text-neutral-100">
            {BUYER_MANIFEST_BUNDLE_DOWNLOAD_DETAILS_SUMMARY}
          </summary>
          <div className="border-t border-neutral-200 px-3 py-3 dark:border-neutral-800">
            <p className="m-0 max-w-prose text-sm text-neutral-800 dark:text-neutral-200">
              Prefer the consolidated bundle for diligence and archiving — it packages the downloadable outputs that align
              to the decisions and posture summarized above.
            </p>
            <p className="m-0 mt-2 text-xs text-neutral-600 dark:text-neutral-400">{BUYER_MANIFEST_BUNDLE_DOWNLOAD_ZIP_NOTE}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" asChild>
                <a href={getBundleDownloadUrl(summary.manifestId)}>Download finalized review package</a>
              </Button>
            </div>
          </div>
        </details>
        ) : null}
        <div id="manifest-buyer-recorded-details" className="space-y-3">
          {!(buyerPolishedLayout ?? false) || !isCuratedDemo ? decisionsBlock : null}
          {warningsBlock}
        </div>
      </section>
    ) : null;

  if (buyerPolishedLayout ?? false) {
    return (
      <>
        {operatorSummary}
        {buyerRecordedOutcomes}
        {buyerPolicyPackCallout}
        {relatedFinding}
        {!isCuratedDemo ? countsGrid : null}
        {auditIdentifiers}
      </>
    );
  }

  return (
    <>
      {operatorSummary}
      {countsGrid}
      {policyLine}
      {decisionsBlock}
      {warningsBlock}
      {auditIdentifiers}
      {relatedFinding}
    </>
  );
}

type CountsGridTilesOptions = {
  readonly buyerPolishedLayout: boolean;
};

function countsGridTiles(summary: ManifestSummary, options: CountsGridTilesOptions): ReactElement {
  const isCuratedDemo = summary.manifestId === SHOWCASE_STATIC_DEMO_MANIFEST_ID;
  const includeShowcaseTrailTiles = options.buyerPolishedLayout && isCuratedDemo;

  const gridClassName = includeShowcaseTrailTiles
    ? "grid grid-cols-2 gap-3 sm:grid-cols-3"
    : "grid grid-cols-2 gap-3 sm:grid-cols-4";

  const graphHref = `/graph?runId=${encodeURIComponent(summary.runId)}`;
  const auditHref = `/audit?runId=${encodeURIComponent(summary.runId)}`;

  return (
    <div className={gridClassName}>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
        <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Status</p>
        <p className="m-0 mt-2">
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100">
            {manifestStatusForDisplay(summary.status)}
          </span>
        </p>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
        <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Decisions</p>
        <p className="m-0 mt-2 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
          {Number.isFinite(summary.decisionCount) ? summary.decisionCount : "—"}
        </p>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
        <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {options.buyerPolishedLayout && isCuratedDemo ? "Monitored risks" : "Warnings"}
        </p>
        <p className="m-0 mt-2 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
          {Number.isFinite(summary.warningCount) ? summary.warningCount : "—"}
        </p>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
        <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Unresolved</p>
        <p className="m-0 mt-2 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
          {Number.isFinite(summary.unresolvedIssueCount) ? summary.unresolvedIssueCount : "—"}
        </p>
      </div>
      {includeShowcaseTrailTiles ? (
        <>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
            <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Evidence trail
            </p>
            <p className="m-0 mt-2 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
              {SHOWCASE_STATIC_DEMO_GRAPH_LINKED_RECORD_COUNT}
            </p>
            <p className="m-0 mt-2 text-xs text-neutral-600 dark:text-neutral-400">Linked records in review trail layout</p>
            <p className="m-0 mt-2 text-xs">
              <Link className="font-medium text-teal-800 underline dark:text-teal-300" href={graphHref}>
                Open interactive graph
              </Link>
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
            <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Audit trail
            </p>
            <p className="m-0 mt-2 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
              {SHOWCASE_STATIC_DEMO_AUDIT_TRAIL_EVENT_COUNT}
            </p>
            <p className="m-0 mt-2 text-xs text-neutral-600 dark:text-neutral-400">Lifecycle events in audit trail</p>
            <p className="m-0 mt-2 text-xs">
              <Link className="font-medium text-teal-800 underline dark:text-teal-300" href={auditHref}>
                Open full audit trail
              </Link>
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
