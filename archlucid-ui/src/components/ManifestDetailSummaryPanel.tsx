import Link from "next/link";
import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import { manifestStatusForDisplay } from "@/lib/manifest-status-display";
import { policyPackBuyerGovernanceDetailHref, policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import {
  SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES,
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
};

/**
 * Manifest summary: metric tiles plus expandable decisions/warnings when we have curated demo copy or counts only.
 */
export function ManifestDetailSummaryPanel(props: ManifestDetailSummaryPanelProps) {
  const { summary, buyerPolishedLayout } = props;
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
        {countsGridTiles(summary)}
      </div>
    ) : (
      countsGridTiles(summary)
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
        <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          Defines the checks referenced during this review. Policy posture informs approvals — it does not replace deployment
          or change-management authority.
        </p>
        {buyerPolicyPackHref !== null ? (
          <p className="m-0 mt-3 text-sm">
            <Link className="font-medium text-teal-800 underline dark:text-teal-300" href={buyerPolicyPackHref}>
              Open policy pack narrative
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
      ? `Warnings in this package (${summary.warningCount})`
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
            and manifest bundle — use the download actions on this page when available.
          </p>
        ) : (
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">No decisions recorded for this manifest.</p>
        )}
        {decisionRestCount > 0 ? (
          <p className="m-0 mt-2 text-xs text-neutral-600 dark:text-neutral-400">
            … and {decisionRestCount} more decisions in the governed export — open review detail or download the manifest
            bundle for the full list.
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
            Warning detail ships with the governed manifest export. Use{" "}
            <Link className="font-medium text-teal-800 underline dark:text-teal-300" href={`/reviews/${summary.runId}`}>
              review detail
            </Link>{" "}
            or download the bundle.
          </p>
        ) : (
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">No warnings recorded for this manifest.</p>
        )}
      </div>
    </details>
  );

  const auditIdentifiers = (
    <CollapsibleSection title="Technical identifiers (audit)" defaultOpen={false}>
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
    isCuratedDemo ? (
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

  const buyerRecordedOutcomes =
    buyerPolishedLayout ?? false ? (
      <section aria-labelledby="manifest-buyer-recorded-heading" className="space-y-3">
        <h3
          id="manifest-buyer-recorded-heading"
          className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400"
        >
          Recorded in this package
        </h3>
        {decisionsBlock}
        {warningsBlock}
      </section>
    ) : null;

  if (buyerPolishedLayout ?? false) {
    return (
      <>
        {operatorSummary}
        {buyerPolicyPackCallout}
        {relatedFinding}
        {buyerRecordedOutcomes}
        {countsGrid}
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

function countsGridTiles(summary: ManifestSummary): ReactElement {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
        <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Warnings</p>
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
    </div>
  );
}
