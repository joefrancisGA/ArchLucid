import { cn } from "@/lib/utils";
import Link from "next/link";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import {
  ManifestDetailSummaryBuyerPackCards,
  ManifestDetailSummaryCountsGrid,
} from "@/components/ManifestDetailSummaryCountsGrid";
import {
  ManifestDetailSummaryBundleDownload,
  ManifestDetailSummaryDecisionsBlock,
  ManifestDetailSummaryWarningsBlock,
} from "@/components/ManifestDetailSummaryDecisionsBlocks";
import { ManifestJsonActions } from "@/components/ManifestJsonActions";
import {
  OPERATOR_LINK,
  OPERATOR_NAV_GROUP_LABEL,
  OPERATOR_SHORT_HELPER_MEASURE_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { policyPackBuyerGovernanceDetailHref, policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import {
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
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
  const detailOpenDefault = !(buyerPolishedLayout ?? false) || isCuratedDemo;
  const isBuyerPolished = buyerPolishedLayout ?? false;

  const manifestJsonActions =
    summary.runId.trim().length > 0 ? (
      <ManifestJsonActions
        runId={summary.runId}
        manifestVersion={summary.manifestVersion}
        className="mt-3"
        buyerPolishedLayout={buyerPolishedLayout}
      />
    ) : null;

  const operatorSummary =
    summary.operatorSummary ? (
      <div className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 px-4 py-3">
        <p className={cn("m-0 font-medium leading-relaxed text-al-text-primary dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
          {summary.operatorSummary}
        </p>
      </div>
    ) : null;

  const countsGrid =
    isBuyerPolished ? (
      <div className="space-y-2">
        <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "text-neutral-600 dark:text-neutral-400")}>
          At a glance
        </p>
        <ManifestDetailSummaryCountsGrid summary={summary} buyerPolishedLayout={true} />
      </div>
    ) : (
      <ManifestDetailSummaryCountsGrid summary={summary} buyerPolishedLayout={false} />
    );

  const policyLine = (
    <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
      <span className="font-medium text-neutral-800 dark:text-neutral-200">Policy pack:</span>{" "}
      {policyPackBuyerLabel(summary.ruleSetId, summary.ruleSetVersion)}
    </p>
  );

  const buyerPolicyPackHref = policyPackBuyerGovernanceDetailHref(summary.ruleSetId);

  const buyerPolicyPackCallout =
    isBuyerPolished ? (
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

  const decisionsBlock = (
    <ManifestDetailSummaryDecisionsBlock
      summary={summary}
      buyerPolishedLayout={isBuyerPolished}
      detailOpenDefault={detailOpenDefault}
    />
  );

  const warningsBlock = (
    <ManifestDetailSummaryWarningsBlock
      summary={summary}
      buyerPolishedLayout={isBuyerPolished}
      detailOpenDefault={detailOpenDefault}
    />
  );

  const auditIdentifiers = (
    <CollapsibleSection
      title={isBuyerPolished ? "Audit verification appendix" : "Verification appendix (identifiers)"}
      defaultOpen={false}
      sectionTestId="manifest-verification-appendix"
    >
      {isBuyerPolished ? manifestJsonActions : null}
      <dl className="m-0 grid gap-3 sm:grid-cols-[minmax(8rem,auto)_1fr] sm:gap-x-6">
        {!isBuyerPolished ? (
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
    isCuratedDemo && !isBuyerPolished ? (
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
    isBuyerPolished && isCuratedDemo ? (
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
    isBuyerPolished ? (
      <section aria-labelledby="manifest-buyer-recorded-heading" className="space-y-3">
        <h3
          id="manifest-buyer-recorded-heading"
          className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "text-neutral-600 dark:text-neutral-400")}
        >
          Package summary
        </h3>
        {buyerManifestProvesCallout}
        <ManifestDetailSummaryBuyerPackCards summary={summary} buyerPolishedLayout={isBuyerPolished} />
        {includeBundleDownload ? (
          <ManifestDetailSummaryBundleDownload summary={summary} />
        ) : null}
        <div id="manifest-buyer-recorded-details" className="space-y-3">
          {!isBuyerPolished || !isCuratedDemo ? decisionsBlock : null}
          {warningsBlock}
        </div>
      </section>
    ) : null;

  if (isBuyerPolished) {
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
