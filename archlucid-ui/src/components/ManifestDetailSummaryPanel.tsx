import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import { ManifestJsonActions } from "@/components/ManifestJsonActions";
import { Button } from "@/components/ui/button";
import { getBundleDownloadUrl } from "@/lib/api";
import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import {
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_LINK,
  OPERATOR_NAV_GROUP_LABEL,
  OPERATOR_SHORT_HELPER_MEASURE_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { manifestStatusForDisplay } from "@/lib/manifest-status-display";
import {
  BUYER_EXAMPLE_COUNT_SUFFIX,
  BUYER_MANIFEST_BUNDLE_DOWNLOAD_DETAILS_SUMMARY,
  BUYER_MANIFEST_BUNDLE_DOWNLOAD_ZIP_NOTE,
  BUYER_MANIFEST_DOWNLOAD_REVIEW_PACKAGE_ZIP,
} from "@/lib/buyer/buyer-polish-copy";
import { policyPackBuyerGovernanceDetailHref, policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
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

  const manifestJsonActions =
    summary.runId.trim().length > 0 ? (
      <ManifestJsonActions runId={summary.runId} className="mt-3" buyerPolishedLayout={buyerPolishedLayout} />
    ) : null;

  const operatorSummary =
    summary.operatorSummary ? (
      <div className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 px-4 py-3">
        <p className={cn("m-0 font-medium leading-relaxed text-teal-900 dark:text-teal-100", OPERATOR_TYPOGRAPHY.body)}>
          {summary.operatorSummary}
        </p>
      </div>
    ) : null;

  const countsGrid =
    buyerPolishedLayout ?? false ? (
      <div className="space-y-2">
        <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "text-neutral-600 dark:text-neutral-400")}>
          At a glance
        </p>
        {countsGridTiles(summary, { buyerPolishedLayout: true })}
      </div>
    ) : (
      countsGridTiles(summary, { buyerPolishedLayout: false })
    );

  const policyLine = (
    <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
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
        className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 p-4"
      >
        <h3 id="manifest-policy-pack-heading" className={cn("m-0 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Policy pack — policy guardrails
        </h3>
        <p className={cn("m-0 mt-2 font-medium leading-snug text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
          {policyPackBuyerLabel(summary.ruleSetId, summary.ruleSetVersion)}
        </p>
        <p className={cn("m-0 mt-2 leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {isCuratedDemo
            ? "Policy pack used for this review — defines checks referenced in diligence. Human approvals do not replace your change-management authority."
            : "Defines referenced checks used in diligence; approvals stay human-approved and do not bypass deployment authority."}
        </p>
        {buyerPolicyPackHref !== null ? (
          <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.body)}>
            <Link className={OPERATOR_LINK.nav} href={buyerPolicyPackHref}>
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
      <summary className={cn("cursor-pointer select-none px-3 py-2 text-neutral-900 dark:text-neutral-100", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        {decisionsSummaryLabel}
      </summary>
      <div className="border-t border-neutral-200 px-3 py-3 dark:border-neutral-800">
        {decisionLinesPreview.length > 0 ? (
          <ol className={cn("m-0 list-decimal space-y-2 pl-5 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {decisionLinesPreview.map((line, index) => (
              <li key={`decision-${index}`}>{line}</li>
            ))}
          </ol>
        ) : summary.decisionCount > 0 ? (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Full decision text is included in the{" "}
            <Link className={OPERATOR_LINK.nav} href={`/architecture/reviews/${summary.runId}`}>
              architecture review export
            </Link>{" "}
            and evidence bundle — use the download actions on this page when available.
          </p>
        ) : (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>No decisions recorded for this finalized review record.</p>
        )}
        {decisionRestCount > 0 ? (
          <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            … and {decisionRestCount} more decisions in the export package — open review detail or download the evidence
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
      <summary className={cn("cursor-pointer select-none px-3 py-2 text-neutral-900 dark:text-neutral-100", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        {warningsSummaryLabel}
      </summary>
      <div className="border-t border-neutral-200 px-3 py-3 dark:border-neutral-800">
        {warningLines.length > 0 ? (
          <ul className={cn("m-0 list-disc space-y-2 pl-5 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {warningLines.map((line, index) => (
              <li key={`warning-${index}`}>{line}</li>
            ))}
          </ul>
        ) : summary.warningCount > 0 ? (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Monitored-risk detail travels with the evidence bundle — use{" "}
            <Link className={OPERATOR_LINK.nav} href={`/architecture/reviews/${summary.runId}`}>
              review detail
            </Link>{" "}
            or download the bundle.
          </p>
        ) : (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>No monitored risks recorded on this finalized review record.</p>
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
      {(buyerPolishedLayout ?? false) ? manifestJsonActions : null}
      <dl className="m-0 grid gap-3 sm:grid-cols-[minmax(8rem,auto)_1fr] sm:gap-x-6">
        {buyerPolishedLayout !== true ? (
          <>
            <dt className={cn("font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>Review ID</dt>
            <dd className={cn("m-0 flex min-w-0 flex-wrap items-center gap-2 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
              <code className={cn("min-w-0 break-all font-mono", OPERATOR_TYPOGRAPHY.micro)}>{summary.runId}</code>
              <CopyIdButton value={summary.runId} aria-label="Copy review ID" />
            </dd>
            <dt className={cn("font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>Review record ID</dt>
            <dd className={cn("m-0 flex min-w-0 flex-wrap items-center gap-2 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
              <code className={cn("min-w-0 break-all font-mono", OPERATOR_TYPOGRAPHY.micro)}>{summary.manifestId}</code>
              <CopyIdButton value={summary.manifestId} aria-label="Copy review record ID" />
            </dd>
          </>
        ) : null}
        {summary.manifestHash ? (
          <>
            <dt className={cn("font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>Hash</dt>
            <dd className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.helper)}>{summary.manifestHash}</span>
            </dd>
            <dd className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} data-testid="manifest-determinism-statement">
              Policy-consistent: outputs follow the same deterministic policy evaluation rules for identical inputs and policy pack versions.
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
        className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 p-4"
      >
        <h3
          id="manifest-related-finding-heading"
          className={cn("m-0 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Related finding
        </h3>
        <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          <Link
            className={OPERATOR_LINK.nav}
            href={`/architecture/reviews/${encodeURIComponent(summary.runId)}/findings/${encodeURIComponent(SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID)}`}
          >
            PHI Minimization Risk
          </Link>
          <span className="text-neutral-600 dark:text-neutral-400"> — open the finding narrative and evidence trail.</span>
        </p>
      </section>
    ) : null;

  const buyerManifestProvesCallout =
    (buyerPolishedLayout ?? false) && isCuratedDemo ? (
      <p
        className={cn(
          "m-0 leading-relaxed text-neutral-700 dark:text-neutral-300",
          OPERATOR_SHORT_HELPER_MEASURE_CLASS,
          OPERATOR_TYPOGRAPHY.body,
        )}
      >
        What this finalized review record proves: a versioned package with enumerated decisions, monitored risks
        under an explicit policy cadence, stable identifiers for audit correlation, and packaged deliverables wired
        to the evidence graph and audit trail.
      </p>
    ) : null;

  const buyerRecordedOutcomes =
    buyerPolishedLayout ?? false ? (
      <section aria-labelledby="manifest-buyer-recorded-heading" className="space-y-3">
        <h3
          id="manifest-buyer-recorded-heading"
          className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "text-neutral-600 dark:text-neutral-400")}
        >
          Package summary
        </h3>
        {buyerManifestProvesCallout}
        {isCuratedDemo ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-testid="manifest-buyer-pack-summary-cards">
            <div className={cn("rounded-lg border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-950", OPERATOR_TYPOGRAPHY.body)}>
              <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "font-medium text-neutral-500 dark:text-neutral-400")}>Decisions recorded</p>
              <p className={cn("m-0 mt-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>{summary.decisionCount}</p>
              <Link
                className={cn("m-0 mt-2 inline-block", OPERATOR_LINK.nav)}
                href={buyerPolishedLayout ? "#manifest-key-decisions" : "#manifest-buyer-recorded-details"}
              >
                View decision list
              </Link>
            </div>
            <div className={cn("rounded-lg border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-950", OPERATOR_TYPOGRAPHY.body)}>
              <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "font-medium text-neutral-500 dark:text-neutral-400")}>Monitored risks</p>
              <p className={cn("m-0 mt-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>{summary.warningCount}</p>
              <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.navHelper)}>Tracked with policy cadence.</p>
            </div>
            <div className={cn("rounded-lg border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-950", OPERATOR_TYPOGRAPHY.body)}>
              <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "font-medium text-neutral-500 dark:text-neutral-400")}>Unresolved blocking issues</p>
              <p className={cn("m-0 mt-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>{summary.unresolvedIssueCount}</p>
            </div>
            <div className={cn("rounded-lg border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-950", OPERATOR_TYPOGRAPHY.body)}>
              <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "font-medium text-neutral-500 dark:text-neutral-400")}>Evidence trail anchors</p>
              <p className={cn("m-0 mt-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>
                {SHOWCASE_STATIC_DEMO_GRAPH_LINKED_RECORD_COUNT} {BUYER_EXAMPLE_COUNT_SUFFIX}
              </p>
              <Link
                href={`/insights/evidence-graph?runId=${encodeURIComponent(canonicalizeDemoRunId(summary.runId))}`}
                className={cn("m-0 mt-2 inline-block", OPERATOR_LINK.nav)}
              >
                Explore decision traceability graph
              </Link>
            </div>
            <div className={cn("rounded-lg border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-950", OPERATOR_TYPOGRAPHY.body)}>
              <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "font-medium text-neutral-500 dark:text-neutral-400")}>Audit events</p>
              <p className={cn("m-0 mt-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>
                {SHOWCASE_STATIC_DEMO_AUDIT_TRAIL_EVENT_COUNT} {BUYER_EXAMPLE_COUNT_SUFFIX}
              </p>
              <Link
                href={auditTrailNavHref(canonicalizeDemoRunId(summary.runId))}
                className={cn("m-0 mt-2 inline-block", OPERATOR_LINK.nav)}
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
          <summary className={cn(
            "cursor-pointer select-none px-3 py-2 outline-none marker:text-neutral-500 focus-visible:ring-2 focus-visible:ring-teal-500/80 dark:text-neutral-100",
            OPERATOR_DISCLOSURE_TRIGGER_CLASS,
          )}>
            {BUYER_MANIFEST_BUNDLE_DOWNLOAD_DETAILS_SUMMARY}
          </summary>
          <div className="border-t border-neutral-200 px-3 py-3 dark:border-neutral-800">
            <p className={cn("m-0 max-w-prose text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
              Prefer the consolidated bundle for diligence and archiving — it packages the downloadable outputs that align
              to the decisions and posture summarized above.
            </p>
            <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{BUYER_MANIFEST_BUNDLE_DOWNLOAD_ZIP_NOTE}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" asChild>
                <a href={getBundleDownloadUrl(summary.manifestId)}>{BUYER_MANIFEST_DOWNLOAD_REVIEW_PACKAGE_ZIP}</a>
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
      {manifestJsonActions}
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

  const graphHref = `/insights/evidence-graph?runId=${encodeURIComponent(summary.runId)}`;
  const auditHref = auditTrailNavHref(summary.runId);

  const manifestTileLabelClass = cn("m-0", OPERATOR_NAV_GROUP_LABEL, "font-medium text-neutral-500 dark:text-neutral-400");

  return (
    <div className={gridClassName}>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
        <p className={manifestTileLabelClass}>Status</p>
        <p className="m-0 mt-2">
          <span className={cn(
            "inline-flex items-center rounded-full border border-emerald-700/40 bg-al-surface-raised px-2.5 py-0.5 text-al-text-primary dark:border-emerald-800/50",
            OPERATOR_TYPOGRAPHY.badge,
          )}>
            {manifestStatusForDisplay(summary.status)}
          </span>
        </p>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
        <p className={manifestTileLabelClass}>Decisions</p>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.kpiValue)}>
          {Number.isFinite(summary.decisionCount) ? summary.decisionCount : " — "}
        </p>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
        <p className={manifestTileLabelClass}>
          {options.buyerPolishedLayout && isCuratedDemo ? "Monitored risks" : "Warnings"}
        </p>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.kpiValue)}>
          {Number.isFinite(summary.warningCount) ? summary.warningCount : " — "}
        </p>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
        <p className={manifestTileLabelClass}>Unresolved</p>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.kpiValue)}>
          {Number.isFinite(summary.unresolvedIssueCount) ? summary.unresolvedIssueCount : " — "}
        </p>
      </div>
      {includeShowcaseTrailTiles ? (
        <>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
            <p className={manifestTileLabelClass}>
              Evidence trail
            </p>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.kpiValue)}>
              {SHOWCASE_STATIC_DEMO_GRAPH_LINKED_RECORD_COUNT}
            </p>
            <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Linked records in review trail layout</p>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
              <Link className={OPERATOR_LINK.nav} href={graphHref}>
                Open interactive graph
              </Link>
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
            <p className={manifestTileLabelClass}>
              Audit trail
            </p>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.kpiValue)}>
              {SHOWCASE_STATIC_DEMO_AUDIT_TRAIL_EVENT_COUNT}
            </p>
            <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Lifecycle events in audit trail</p>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
              <Link className={OPERATOR_LINK.nav} href={auditHref}>
                Open full audit trail
              </Link>
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
