import { DELIVERABLES_BUNDLE_LABEL } from "@/lib/usability/canonical-product-terms";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { InlineGlossaryChip } from "@/components/InlineGlossaryChip";
import { OperatorDemoStaticBanner } from "@/components/operator/OperatorDemoStaticBanner";
import { GovernanceSealedRecordDetailBreadcrumb } from "@/components/governance/GovernanceSealedRecordDetailBreadcrumb";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { CtoDemoBuyerValueStrip } from "@/components/cto-demo/CtoDemoBuyerValueStrip";
import {
  OperatorEvidenceLimitsFooter,
} from "@/components/operator/OperatorEvidenceLimitsFooter";
import { ArtifactListTable } from "@/components/ArtifactListTable";
import { ManifestBuyerBundleDownloadSection } from "@/components/ManifestBuyerBundleDownloadSection";
import { ManifestDeliverableGrid } from "@/components/ManifestDeliverableGrid";
import { ManifestDetailSummaryPanel } from "@/components/ManifestDetailSummaryPanel";
import { ManifestTopDecisionsCard } from "@/components/ManifestTopDecisionsCard";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import {
  OperatorMalformedCallout,
} from "@/components/operator/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { shouldShowOperatorDemoMarketingChrome } from "@/lib/buyer/buyer-demo-content-gating";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { getBundleDownloadUrl } from "@/lib/api";
import {
  BUYER_MANIFEST_AUTHORITY_SUMMARY,
  BUYER_MANIFEST_DOWNLOAD_PREPARING,
  BUYER_MANIFEST_HEADLINE_SUFFIX,
  BUYER_MANIFEST_NO_DELIVERABLES_YET,
  BUYER_MANIFEST_TOP_RISK_CTA,
  BUYER_SIGNED_DECISION_RECORD_LABEL,
} from "@/lib/buyer/buyer-polish-copy";
import {
  SHOWCASE_BUYER_REVIEW_TITLE,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
import {
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_NAV_GROUP_LABEL,
  OPERATOR_SHORT_HELPER_MEASURE_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  SEALED_RECORD_DETAIL_PRIMARY_CONTENT_ID,
  SEALED_RECORD_DETAIL_SKIP_LINK_LABEL,
} from "@/lib/sealed-record-detail-page-copy";
import { MANIFEST_ARTIFACTS_LIST_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import type { ManifestDetailSectionTabId } from "@/lib/manifest-detail-section-tabs";
import { ManifestDetailBuyerChrome } from "./ManifestDetailBuyerChrome";
import { ManifestDetailNextRecordFooterClient } from "./ManifestDetailNextRecordFooterClient";
import { ManifestDetailSectionTabs } from "./ManifestDetailSectionTabs";
import type { ManifestDetailPageSuccessModel } from "./manifest-detail-page-model";

type ManifestDetailPageViewProps = {
  readonly model: ManifestDetailPageSuccessModel;
  readonly initialTab?: ManifestDetailSectionTabId;
};

/** Server-rendered success layout: header chrome, section tabs, evidence footer. */
export function ManifestDetailPageView(props: ManifestDetailPageViewProps) {
  const model = props.model;
  const { manifestId, buyerPolishedLayout, summary, artifacts } = model;
  const initialTab = props.initialTab;

  const showcasePackage =
    summary.manifestId === SHOWCASE_STATIC_DEMO_MANIFEST_ID ||
    canonicalizeDemoRunId(summary.runId.trim()) === SHOWCASE_STATIC_DEMO_RUN_ID;

  const showcaseBuyerManifestHeadline =
    buyerPolishedLayout === true && showcasePackage === true;

  const primaryFindingHref = showcasePackage
    ? `/architecture/reviews/${encodeURIComponent(canonicalizeDemoRunId(summary.runId.trim()))}/findings/${encodeURIComponent(SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID)}`
    : null;

  const overviewSummaryCard = (
    <Card id="manifest-overview" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{buyerPolishedLayout ? "Overview" : "Summary"}</CardTitle>
        <CardDescription>
          {buyerPolishedLayout
            ? "Status, policy posture, and what is included in this package."
            : "Status, rules, and counts for this review."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ManifestDetailSummaryPanel
          summary={summary}
          buyerPolishedLayout={buyerPolishedLayout}
          includeBundleDownload={!buyerPolishedLayout}
        />
      </CardContent>
    </Card>
  );

  const decisionsLeadCard = <ManifestTopDecisionsCard summary={summary} buyerPolishedLayout={buyerPolishedLayout} />;

  const showMonitoredRisk = summary.warningCount > 0 || summary.unresolvedIssueCount > 0;

  const monitoredRiskCard = showMonitoredRisk ? (
    <Card
      id={buyerPolishedLayout ? "manifest-monitored-risk" : undefined}
      className={buyerPolishedLayout ? "scroll-mt-24" : undefined}
    >
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>
          {buyerPolishedLayout ? "Related monitored risk" : "Related findings"}
        </CardTitle>
        <CardDescription>
          {buyerPolishedLayout
            ? "This package records a monitored risk that maps back to the originating review and evidence trail."
            : "Warnings or unresolved issues on this review correspond to surfaced findings on the originating review."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className={cn("m-0 max-w-prose text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {buyerPolishedLayout
            ? "Use the review summary to open each finding with full context and trace detail when available."
            : "Open the aggregate architecture review summary on review detail — per-finding links appear when trace confidence rows are available."}
        </p>
        {buyerPolishedLayout && primaryFindingHref ? (
          <div className={cn("mt-3 space-y-3 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50 p-3", OPERATOR_TYPOGRAPHY.body)}>
            <dl className={cn("m-0 grid gap-2 text-al-text-primary sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
              <div>
                <dt className={OPERATOR_NAV_GROUP_LABEL}>
                  Severity
                </dt>
                <dd className="m-0 mt-0.5">High</dd>
              </div>
              <div>
                <dt className={OPERATOR_NAV_GROUP_LABEL}>
                  Risk area
                </dt>
                <dd className="m-0 mt-0.5">PHI minimization</dd>
              </div>
              <div>
                <dt className={OPERATOR_NAV_GROUP_LABEL}>
                  Disposition
                </dt>
                <dd className="m-0 mt-0.5">Accepted with monitoring</dd>
              </div>
              <div>
                <dt className={OPERATOR_NAV_GROUP_LABEL}>
                  Blocking status
                </dt>
                <dd className="m-0 mt-0.5">Non-blocking</dd>
              </div>
            </dl>
            <ul className={cn("m-0 list-none space-y-2 p-0 leading-snug text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              <li>
                <strong className="text-neutral-900 dark:text-neutral-100">Risk:</strong> expanded breach and audit
                scope if minimization is understated.
              </li>
              <li>
                <strong className="text-neutral-900 dark:text-neutral-100">Mitigation:</strong> classification at
                ingress, adapter boundaries, retention controls tied to evidence in this package.
              </li>
              <li>
                <strong className="text-neutral-900 dark:text-neutral-100">Validation:</strong> trace exception paths
                and attachment volume through go-live monitoring.
              </li>
            </ul>
          </div>
        ) : null}
        <div className="mt-4">
          <Button variant="secondary" size="sm" asChild>
            <Link
              href={
                primaryFindingHref ?? `/architecture/reviews/${encodeURIComponent(summary.runId)}#run-explanation`
              }
            >
              {primaryFindingHref
                ? BUYER_MANIFEST_TOP_RISK_CTA
                : buyerPolishedLayout
                  ? "View findings on review"
                  : "Open review findings"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  ) : null;

  const diligenceAskCard = buyerPolishedLayout ? (
    <Card id="manifest-ask" className="scroll-mt-24 border border-neutral-200 bg-al-surface-raised shadow-sm dark:border-neutral-800">
      <CardHeader className="pb-2">
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Questions during diligence?</CardTitle>
        <CardDescription>
          Two paths: ask the evidence directly in this package, or route procurement and security questionnaires to our
          Trust Center.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex flex-col gap-1.5">
          <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>
            Product &amp; evidence questions
          </p>
          <Button variant="primary" size="sm" asChild>
            <Link href={`/insights/ask-review-questions?runId=${encodeURIComponent(summary.runId)}`}>Ask about this review</Link>
          </Button>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>
            Procurement &amp; security follow-up
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/trust#trust-contact-review">Contact Trust Center</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  ) : null;

  const deliverablesCard = (
    <Card
      id={buyerPolishedLayout ? "manifest-deliverables" : undefined}
      className={buyerPolishedLayout ? "scroll-mt-24" : undefined}
    >
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1.5">
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>
            {buyerPolishedLayout ? "Deliverables" : "Generated artifacts"}
          </CardTitle>
          <CardDescription>
            {buyerPolishedLayout
              ? "These deliverables package the sponsor decision, architecture review board record, and audit evidence for sign-off and diligence. Rows below list individual deliverable artifacts — prefer the consolidated package download when your workspace publishes a full bundle."
              : "Outputs produced during this review — available for preview and download."}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!buyerPolishedLayout ? (
          <div>
            <Button variant="outline" size="sm" asChild>
              <a href={getBundleDownloadUrl(manifestId)}>Download bundle (ZIP)</a>
            </Button>
          </div>
        ) : null}

        {model.artifactsFailure && (
          <>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {buyerPolishedLayout ? "Deliverables list could not be loaded." : "Artifact list could not be loaded."}
            </p>
            <OperatorApiProblem
              problem={model.artifactsFailure.problem}
              fallbackMessage={model.artifactsFailure.message}
              correlationId={model.artifactsFailure.correlationId}
              variant="warning"
            />
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {buyerPolishedLayout ? (
                <>
                  Try reloading, or return to the review. You can still use Download finalized review when the
                  bundle is available.
                </>
              ) : (
                <>
                  Try reloading, or return to the review detail page. You can still use Download bundle (ZIP) if the list
                  endpoint is unavailable.
                </>
              )}
            </p>
          </>
        )}

        {!model.artifactsFailure && model.artifactsMalformed && (
          <>
            <OperatorMalformedCallout>
              <strong>
                {buyerPolishedLayout
                  ? "Deliverables response was not usable."
                  : "Artifact list response was not usable."}
              </strong>
              <p className="mt-2">{model.artifactsMalformed}</p>
            </OperatorMalformedCallout>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {buyerPolishedLayout
                ? "Try reloading, or return to the review. ZIP download may still work."
                : "Try reloading, or return to the review detail page. Bundle download may still work."}
            </p>
          </>
        )}

        {!model.artifactsFailure && !model.artifactsMalformed && artifacts.length === 0 && (
          <EnterpriseCompactEmptyState
            {...MANIFEST_ARTIFACTS_LIST_EMPTY_COMPACT}
            title={buyerPolishedLayout ? BUYER_MANIFEST_NO_DELIVERABLES_YET : MANIFEST_ARTIFACTS_LIST_EMPTY_COMPACT.title}
            description={
              buyerPolishedLayout ? (
                <p className="m-0">{BUYER_MANIFEST_DOWNLOAD_PREPARING}</p>
              ) : (
                <>
                  <p className="m-0">{MANIFEST_ARTIFACTS_LIST_EMPTY_COMPACT.description}</p>
                  <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                    This is a <strong>valid empty result</strong> (HTTP 200 with an empty list), not a failed artifact-list
                    request. <strong>Bundle ZIP may return 404</strong> when no packaged bundle exists yet.
                  </p>
                </>
              )
            }
          />
        )}

        {!model.artifactsFailure && !model.artifactsMalformed && artifacts.length > 0 && buyerPolishedLayout ? (
          <details className="group rounded-md border border-neutral-200/90 bg-neutral-50/40 p-3 dark:border-neutral-800 dark:bg-neutral-950/30">
            <summary
              className={cn(
                "cursor-pointer select-none text-al-text-primary outline-none marker:text-al-text-secondary focus-visible:ring-2 focus-visible:ring-teal-500/80",
                OPERATOR_DISCLOSURE_TRIGGER_CLASS,
              )}
            >
              Show deliverable artifacts ({artifacts.length})
            </summary>
            <div className="mt-4">
              <ArtifactListTable
                manifestId={manifestId}
                artifacts={artifacts}
                sponsorMode={buyerPolishedLayout}
                audienceSections={buyerPolishedLayout}
              />
            </div>
          </details>
        ) : null}
        {!model.artifactsFailure && !model.artifactsMalformed && artifacts.length > 0 && !buyerPolishedLayout ? (
          <ArtifactListTable
            manifestId={manifestId}
            artifacts={artifacts}
            sponsorMode={buyerPolishedLayout}
            audienceSections={buyerPolishedLayout}
          />
        ) : null}
      </CardContent>
    </Card>
  );

  return (
    <OperatorPageContainer
      variant="dashboard"
      className={cn("px-1 py-2 sm:px-0", OPERATOR_LAYOUT.sectionStack)}
    >
      {buyerPolishedLayout ? (
        <a
          href={`#${SEALED_RECORD_DETAIL_PRIMARY_CONTENT_ID}`}
          className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
        >
          {SEALED_RECORD_DETAIL_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <div
        id={buyerPolishedLayout ? SEALED_RECORD_DETAIL_PRIMARY_CONTENT_ID : undefined}
        className={cn(buyerPolishedLayout ? "scroll-mt-24" : undefined, OPERATOR_LAYOUT.sectionStack)}
        data-testid="sealed-record-detail-primary-content"
      >
      {!buyerPolishedLayout ? <CtoDemoBuyerValueStrip stepIndex={1} /> : null}
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <Link
          className={OPERATOR_LINK.nav}
          href={`/architecture/reviews/${summary.runId}`}
          data-testid="manifest-detail-back-to-review"
        >
          {buyerPolishedLayout === true && showcasePackage === true
            ? `Back to ${SHOWCASE_BUYER_REVIEW_TITLE}`
            : "Back to review"}
        </Link>
        {showcasePackage === true && buyerPolishedLayout !== true ? (
          <>
            {" · "}
            <Link
              className={OPERATOR_LINK.nav}
              href={`/showcase/${encodeURIComponent(summary.runId)}`}
            >
              Public showcase
            </Link>
          </>
        ) : null}
      </p>

      {shouldShowOperatorDemoMarketingChrome(buyerPolishedLayout === true, model.usedStaticDemoManifest) ? (
        <OperatorDemoStaticBanner />
      ) : null}

      <OperatorPageHeader
        navHref={SIGNED_RECORDS_LIST_PATH}
        title={
          showcaseBuyerManifestHeadline === true
            ? `${BUYER_SIGNED_DECISION_RECORD_LABEL} — ${BUYER_MANIFEST_HEADLINE_SUFFIX}`
            : buyerPolishedLayout
              ? BUYER_SIGNED_DECISION_RECORD_LABEL
              : "Finalized architecture review"
        }
        headingLevel="h1"
        breadcrumb={buyerPolishedLayout ? <GovernanceSealedRecordDetailBreadcrumb /> : undefined}
        subtitle={
          buyerPolishedLayout ? (
            <>
              {showcasePackage === true ? (
                BUYER_MANIFEST_AUTHORITY_SUMMARY
              ) : (
                <>
                  This is the <InlineGlossaryChip nounId="sealed-review-record" pulseOnFirstEncounter={false}>Finalized review record</InlineGlossaryChip> for the architecture review —{" "}
                  <InlineGlossaryChip nounId="decision" pulseOnFirstEncounter={false}>decisions</InlineGlossaryChip>,{" "}
                  <InlineGlossaryChip nounId="finding" pulseOnFirstEncounter={false}>findings</InlineGlossaryChip>, and the files you
                  can open or download.
                </>
              )}
            </>
          ) : (
            <>
              A <InlineGlossaryChip nounId="sealed-review-record" pulseOnFirstEncounter={false}>Finalized review record</InlineGlossaryChip> is the immutable authority for this review. It captures{" "}
              <InlineGlossaryChip nounId="decision" pulseOnFirstEncounter={false}>decisions</InlineGlossaryChip>,{" "}
              <InlineGlossaryChip nounId="finding" pulseOnFirstEncounter={false}>findings</InlineGlossaryChip>, and
              the downloadable <InlineGlossaryChip nounId="deliverable" pulseOnFirstEncounter={false}>{DELIVERABLES_BUNDLE_LABEL.toLowerCase()}</InlineGlossaryChip> linked from review detail.
            </>
          )
        }
        actions={
          buyerPolishedLayout !== true ? (
            <Button variant="primary" size="sm" asChild>
              <a href={getBundleDownloadUrl(manifestId)}>Export review bundle</a>
            </Button>
          ) : undefined
        }
      />

      <ManifestDetailBuyerChrome />

      {showcaseBuyerManifestHeadline === true ? (
        <section
          aria-labelledby="manifest-authority-summary-heading"
          className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 p-4 shadow-sm"
          data-testid="manifest-buyer-authority-summary"
        >
          <h2 id="manifest-authority-summary-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
            What this Finalized review record proves
          </h2>
          <p
            className={cn(
              "m-0 mt-2 leading-relaxed text-al-text-primary",
              OPERATOR_SHORT_HELPER_MEASURE_CLASS,
              OPERATOR_TYPOGRAPHY.body,
            )}
          >
            {BUYER_MANIFEST_AUTHORITY_SUMMARY}
          </p>
        </section>
      ) : null}

      {buyerPolishedLayout ? (
        <ManifestDetailSectionTabs
          initialTab={initialTab}
          decision={
            <div id="manifest-decision-group" className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}>
              {summary.warningCount > 0 || summary.unresolvedIssueCount > 0 ? monitoredRiskCard : null}
              {overviewSummaryCard}
              <div id="manifest-decisions" className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}>
                {decisionsLeadCard}
              </div>
            </div>
          }
          evidence={
            <>
              <ManifestDeliverableGrid
                manifestId={manifestId}
                runId={summary.runId}
                buyerPolished={buyerPolishedLayout}
                systemName={showcaseBuyerManifestHeadline ? SHOWCASE_BUYER_REVIEW_TITLE : undefined}
              />
              {deliverablesCard}
            </>
          }
          downloads={<ManifestBuyerBundleDownloadSection manifestId={manifestId} expanded />}
          diligence={diligenceAskCard}
        />
      ) : (
        <>
          {decisionsLeadCard}
          {overviewSummaryCard}
          {monitoredRiskCard}
          {deliverablesCard}
        </>
      )}

      <ManifestDetailNextRecordFooterClient manifestId={manifestId} />

      <OperatorEvidenceLimitsFooter
        runId={summary.runId}
        execution={model.manifestFooterExecution}
        showArchitectureReviewSummaryLink
      />
      </div>
    </OperatorPageContainer>
  );
}
