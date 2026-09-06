import { cn } from "@/lib/utils";

import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { FindingOptionalArtifactUnavailable } from "@/components/findings/FindingOptionalArtifactUnavailable";
import { FindingJobViewLaneCallout } from "@/components/findings/FindingJobViewLaneCallout";
import { FindingDetailInspectDisclosures } from "./FindingDetailInspectDisclosures";
import { SponsorPlainEnglishFindingPanel } from "@/components/findings/SponsorPlainEnglishFindingPanel";
import { FindingExplainabilityTracePanel } from "@/components/findings/FindingExplainabilityTracePanel";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { FINDING_DETAIL_CLAIM_DISCIPLINE } from "@/lib/findings/finding-detail-evidence-copy";
import { FindingPolicyCitationHero } from "@/components/findings/FindingPolicyCitationHero";
import { phiMinimizationBuyerConsequenceNarrative } from "@/lib/findings/finding-display-from-inspect";
import { DESIGN_TOKENS, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  resolveFindingDetailWorkflowEmphasizedStepId,
  resolveFindingDetailWorkflowSteps,
  resolveFindingDetailWorkflowTraceReadyFromPayload,
} from "@/lib/finding-detail-workflow-checklist";

import { FindingInspectFindingBody } from "../FindingInspectFindingBody";
import { FindingInspectRecommendedActionSection } from "../FindingInspectRecommendedActionSection";
import { FindingInspectWhyMattersSection } from "../FindingInspectWhyMattersSection";
import { FindingInspectContextDebugPanel } from "@/components/findings/FindingInspectContextDebugPanel";
import { FindingDetailBreadcrumb } from "./FindingDetailBreadcrumb";
import { FindingDetailBuyerChrome } from "./FindingDetailBuyerChrome";
import { FindingDetailDecisionSummary } from "./FindingDetailDecisionSummary";
import { FindingDetailOperationalActions } from "./FindingDetailOperationalActions";
import { FINDING_DETAIL_PRIMARY_CONTENT_ID, findingDetailPageSubtitle } from "./finding-detail-page-copy";
import { validationRequirement } from "./finding-detail-route-display";
import type { FindingDetailPresentation } from "./finding-detail-presentation";

type Props = { readonly presentation: FindingDetailPresentation };

/** Finding detail inspect body. */
export function FindingDetailInspectBody({ presentation }: Props) {
  const {
    model,
    showBuyerPolishedBody,
    buyerHeroSubtitle,
    decisionSummary,
    severityConstraintNote,
    findingJobView,
    demoFillGaps,
    whyThisMattersNarrative,
    buyerStructuredActions,
    buyerRecommendedActionParagraph,
    sponsorPlainEnglishInput,
    evidenceBasisSummary,
    policyProvenanceModel,
    policyTraceExcerpt,
    severityRationale,
    graphEvidenceHref,
    linkedManifestHref,
    inspectHref,
    findingsQueueNavHref,
    reviewPackageHref,
    reviewFindingsHref,
    severityHeadline,
  } = presentation;
  const {
    runId,
    findingIdRouteParam,
    decodedFindingId,
    inspectPayload,
    inspectFailure,
    buyerPolishedShell,
    pageTitle,
    findingIsPhi,
  } = model;

  const scopedRunId = runId.trim();
  const findingDetailWorkflowSteps = resolveFindingDetailWorkflowSteps({
    reviewPicked: scopedRunId.length > 0,
    summaryLoaded: inspectPayload !== null,
    traceReady:
      inspectPayload !== null
        ? resolveFindingDetailWorkflowTraceReadyFromPayload({
            evidenceCount: inspectPayload.evidence.length,
            decisionRuleId: inspectPayload.decisionRuleId,
            reasoningTrace: inspectPayload.reasoningTrace,
          })
        : false,
  });
  const findingDetailWorkflowEmphasizedStepId = resolveFindingDetailWorkflowEmphasizedStepId({
    reviewPicked: scopedRunId.length > 0,
    summaryLoaded: inspectPayload !== null,
    traceReady:
      inspectPayload !== null
        ? resolveFindingDetailWorkflowTraceReadyFromPayload({
            evidenceCount: inspectPayload.evidence.length,
            decisionRuleId: inspectPayload.decisionRuleId,
            reasoningTrace: inspectPayload.reasoningTrace,
          })
        : false,
  });

  return (
    <>
      {showBuyerPolishedBody ? (
        <div
          id={FINDING_DETAIL_PRIMARY_CONTENT_ID}
          data-testid="finding-detail-primary-content"
          className="space-y-4"
        >
          <IntegrationConnectChecklist
            title="Finding workflow checklist"
            steps={findingDetailWorkflowSteps}
            emphasizedStepId={findingDetailWorkflowEmphasizedStepId}
            testIdPrefix="finding-detail-workflow"
          />
          <section className={cn("overflow-hidden rounded-lg border p-5", DESIGN_TOKENS.surface.card)}>
            <div className="max-w-3xl space-y-3">
              <OperatorPageHeader
                navHref={findingsQueueNavHref}
                title={pageTitle}
                headingLevel="h1"
                breadcrumb={
                  <FindingDetailBreadcrumb
                    reviewFindingsHref={reviewFindingsHref}
                    findingTitle={pageTitle}
                  />
                }
                subtitle={findingDetailPageSubtitle(buyerPolishedShell, buyerHeroSubtitle)}
                claimDiscipline={FINDING_DETAIL_CLAIM_DISCIPLINE}
                claimDisciplineTestId="finding-detail-claim-discipline"
                subtitleClassName="max-w-2xl leading-relaxed"
              >
                {severityRationale.length > 0 ? (
                  <p className={cn("m-0 max-w-2xl leading-snug text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {severityRationale}
                  </p>
                ) : null}
                {policyProvenanceModel !== null &&
                (policyProvenanceModel.pack !== null || policyProvenanceModel.policy !== null) ? (
                  <FindingPolicyCitationHero
                    model={policyProvenanceModel}
                    traceExcerpt={policyTraceExcerpt}
                  />
                ) : null}
              </OperatorPageHeader>
              <FindingDetailBuyerChrome runId={runId} findingId={decodedFindingId} />
            </div>

            {findingIsPhi ? (
              <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>Focused finding narrative</p>
                <p className={cn("m-0 mt-2 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  {phiMinimizationBuyerConsequenceNarrative()}
                </p>
              </div>
            ) : null}
          </section>

          {decisionSummary !== null ? (
            <FindingDetailDecisionSummary
              summary={decisionSummary}
              runId={runId}
              findingId={decodedFindingId}
              severityConstraintNote={severityConstraintNote}
            />
          ) : null}

          {findingJobView !== null ? (
            <FindingJobViewLaneCallout jobView={findingJobView} runId={runId} />
          ) : null}

          {inspectPayload !== null ? (
            <FindingDetailOperationalActions
              runId={runId}
              findingId={decodedFindingId}
              payload={inspectPayload}
              graphEvidenceHref={graphEvidenceHref}
              linkedManifestHref={linkedManifestHref}
              inspectHref={inspectHref}
            />
          ) : null}

          {inspectPayload !== null ? (
            <FindingInspectWhyMattersSection
              payload={inspectPayload}
              variant="detail"
              demoFillGaps={demoFillGaps}
              whyThisMattersNarrative={whyThisMattersNarrative}
            />
          ) : null}

          {inspectPayload !== null && buyerRecommendedActionParagraph !== null ? (
            <FindingInspectRecommendedActionSection
              tone="detail"
              structuredActions={[...buyerStructuredActions]}
              recommendedActionParagraph={buyerRecommendedActionParagraph}
              showOwnerCadence
            />
          ) : null}

          <SponsorPlainEnglishFindingPanel
            input={sponsorPlainEnglishInput}
            collapsedByDefault={false}
          />

          {inspectPayload !== null ? (
            <FindingDetailInspectDisclosures
              runId={runId}
              findingIdRouteParam={findingIdRouteParam}
              decodedFindingId={decodedFindingId}
              inspectPayload={inspectPayload}
              demoFillGaps={demoFillGaps}
              evidenceBasisSummary={evidenceBasisSummary}
              validationRequirementText={validationRequirement(inspectPayload, decodedFindingId)}
              reviewPackageHref={reviewPackageHref}
              graphEvidenceHref={graphEvidenceHref}
              linkedManifestHref={linkedManifestHref}
              citationModel={policyProvenanceModel}
            />
          ) : null}
        </div>
      ) : null}
      {inspectFailure !== null ? (
        buyerPolishedShell ? (
          <FindingOptionalArtifactUnavailable
            heading="Finding detail temporarily unavailable"
            body="ArchLucid could not load the full finding record right now. Your review summary and evidence graph remain available."
            tryNext="Return to the review findings list to pick another finding or open the review summary."
            showRetry={false}
            recoveryLinks={[{ href: reviewFindingsHref, label: "Back to findings" }]}
            failure={inspectFailure}
            buyerPolishedShell
          />
        ) : (
          <OperatorApiProblem
            problem={inspectFailure.problem}
            fallbackMessage={inspectFailure.message}
            correlationId={inspectFailure.correlationId}
          />
        )
      ) : null}

      {inspectPayload !== null && !buyerPolishedShell ? (
        <FindingInspectFindingBody
          runId={runId}
          decodedFindingId={decodedFindingId}
          payload={inspectPayload}
          variant="detail"
        />
      ) : null}

      {!buyerPolishedShell ? (
        <SponsorPlainEnglishFindingPanel
          input={sponsorPlainEnglishInput}
          collapsedByDefault={false}
        />
      ) : null}

      {inspectPayload !== null && !buyerPolishedShell ? (
        <FindingExplainabilityTracePanel runId={runId} findingId={decodedFindingId} />
      ) : null}

      {inspectPayload !== null && !buyerPolishedShell ? (
        <FindingInspectContextDebugPanel
          runId={runId}
          findingId={decodedFindingId}
          inspectPayload={inspectPayload}
        />
      ) : null}
    </>
  );
}
