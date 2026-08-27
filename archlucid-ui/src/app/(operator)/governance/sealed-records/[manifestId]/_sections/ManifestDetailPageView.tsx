import { DELIVERABLES_BUNDLE_LABEL } from "@/lib/usability/canonical-product-terms";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { InlineGlossaryChip } from "@/components/InlineGlossaryChip";
import { OperatorDemoStaticBanner } from "@/components/operator/OperatorDemoStaticBanner";
import { GovernanceSealedRecordDetailBreadcrumb } from "@/components/governance/GovernanceSealedRecordDetailBreadcrumb";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { SIGNED_RECORDS_LIST_PATH, signedRecordDetailPath } from "@/lib/signed-records-paths";
import { CtoDemoBuyerValueStrip } from "@/components/cto-demo/CtoDemoBuyerValueStrip";
import {
  OperatorEvidenceLimitsFooter,
} from "@/components/operator/OperatorEvidenceLimitsFooter";
import { ManifestBuyerBundleDownloadSection } from "@/components/ManifestBuyerBundleDownloadSection";
import { ManifestDeliverableGrid } from "@/components/ManifestDeliverableGrid";
import { ManifestTopDecisionsCard } from "@/components/ManifestTopDecisionsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { shouldShowOperatorDemoMarketingChrome } from "@/lib/buyer/buyer-demo-content-gating";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { getBundleDownloadUrl } from "@/lib/api";
import {
  BUYER_MANIFEST_AUTHORITY_SUMMARY,
  BUYER_MANIFEST_HEADLINE_SUFFIX,
  BUYER_SIGNED_DECISION_RECORD_LABEL,
} from "@/lib/buyer/buyer-polish-copy";
import {
  SHOWCASE_BUYER_REVIEW_TITLE,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
import {
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
import type { ManifestDetailSectionTabId } from "@/lib/manifest-detail-section-tabs";
import {
  resolveManifestDetailInspectEmphasizedStepId,
  resolveManifestDetailInspectSteps,
} from "@/lib/manifest-detail-inspect-checklist";
import { ManifestDetailBuyerChrome } from "./ManifestDetailBuyerChrome";
import { ManifestDetailNextRecordFooterClient } from "./ManifestDetailNextRecordFooterClient";
import { SignedRecordsListNextReviewFooterClient } from "@/app/(operator)/governance/sealed-records/_sections/SignedRecordsListNextReviewFooterClient";
import { ManifestDetailSectionTabs } from "./ManifestDetailSectionTabs";
import type { ManifestDetailPageSuccessModel } from "./manifest-detail-page-model";
import { ManifestDetailOverviewCard } from "./ManifestDetailOverviewCard";
import { ManifestDetailMonitoredRiskCard } from "./ManifestDetailMonitoredRiskCard";
import { ManifestDetailDeliverablesCard } from "./ManifestDetailDeliverablesCard";

type ManifestDetailPageViewProps = {
  readonly model: ManifestDetailPageSuccessModel;
  readonly initialTab?: ManifestDetailSectionTabId;
  readonly listScopedRunId?: string | null;
};

/** Server-rendered success layout: header chrome, section tabs, evidence footer. */
export function ManifestDetailPageView(props: ManifestDetailPageViewProps) {
  const model = props.model;
  const { manifestId, buyerPolishedLayout, summary, artifacts } = model;
  const initialTab = props.initialTab;
  const listScopedRunId = (props.listScopedRunId ?? "").trim();
  const listScopedRunFilterActive = listScopedRunId.length > 0;
  const manifestDetailInspectSteps = resolveManifestDetailInspectSteps({
    reviewPicked: listScopedRunFilterActive || summary.runId.trim().length > 0,
    recordLoaded: true,
    deliverablesReady: artifacts.length > 0,
  });
  const manifestDetailInspectEmphasizedStepId = resolveManifestDetailInspectEmphasizedStepId({
    reviewPicked: listScopedRunFilterActive || summary.runId.trim().length > 0,
    recordLoaded: true,
    deliverablesReady: artifacts.length > 0,
  });
  const manifestDetailClearScopeHref = signedRecordDetailPath(manifestId);

  const showcasePackage =
    summary.manifestId === SHOWCASE_STATIC_DEMO_MANIFEST_ID ||
    canonicalizeDemoRunId(summary.runId.trim()) === SHOWCASE_STATIC_DEMO_RUN_ID;

  const showcaseBuyerManifestHeadline =
    buyerPolishedLayout === true && showcasePackage === true;

  const primaryFindingHref = showcasePackage
    ? `/architecture/reviews/${encodeURIComponent(canonicalizeDemoRunId(summary.runId.trim()))}/findings/${encodeURIComponent(SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID)}`
    : null;

  const overviewSummaryCard = (
    <ManifestDetailOverviewCard summary={summary} buyerPolishedLayout={buyerPolishedLayout} />
  );

  const decisionsLeadCard = <ManifestTopDecisionsCard summary={summary} buyerPolishedLayout={buyerPolishedLayout} />;

  const showMonitoredRisk = summary.warningCount > 0 || summary.unresolvedIssueCount > 0;

  const monitoredRiskCard = (
    <ManifestDetailMonitoredRiskCard
      summary={summary}
      buyerPolishedLayout={buyerPolishedLayout}
      primaryFindingHref={primaryFindingHref}
    />
  );

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
    <ManifestDetailDeliverablesCard
      manifestId={manifestId}
      buyerPolishedLayout={buyerPolishedLayout}
      artifacts={artifacts}
      artifactsFailure={model.artifactsFailure}
      artifactsMalformed={model.artifactsMalformed}
    />
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

      {listScopedRunFilterActive ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="sealed-record-detail-run-scope-banner"
        >
          {"Scoped to review "}
          <span className="font-mono text-al-text-primary">{listScopedRunId}</span>
          {" from sealed records list · "}
          <Link className={OPERATOR_LINK.inline} href={manifestDetailClearScopeHref}>
            Clear review scope
          </Link>
          {" · "}
          <Link
            className={OPERATOR_LINK.inline}
            href={`/architecture/reviews/${encodeURIComponent(listScopedRunId)}`}
          >
            Open review
          </Link>
        </p>
      ) : null}

      {buyerPolishedLayout ? (
        <IntegrationConnectChecklist
          title="Record inspect checklist"
          steps={manifestDetailInspectSteps}
          emphasizedStepId={manifestDetailInspectEmphasizedStepId}
          testIdPrefix="sealed-record-detail-inspect"
        />
      ) : null}

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
              {showMonitoredRisk ? monitoredRiskCard : null}
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

      <SignedRecordsListNextReviewFooterClient runId={summary.runId.trim()} />

      <OperatorEvidenceLimitsFooter
        runId={summary.runId}
        execution={model.manifestFooterExecution}
        showArchitectureReviewSummaryLink
      />
      </div>
    </OperatorPageContainer>
  );
}
