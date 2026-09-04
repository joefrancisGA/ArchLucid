import { cn } from "@/lib/utils";

import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { FindingOptionalArtifactUnavailable } from "@/components/findings/FindingOptionalArtifactUnavailable";
import { FindingJobViewLaneCallout } from "@/components/findings/FindingJobViewLaneCallout";
import { FindingItsmExportPanel } from "@/components/findings/FindingItsmExportPanel";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import { FindingExplainPanel } from "@/components/FindingExplainPanel";
import { SponsorPlainEnglishFindingPanel } from "@/components/findings/SponsorPlainEnglishFindingPanel";
import { FindingExplainabilityTracePanel } from "@/components/findings/FindingExplainabilityTracePanel";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { FINDING_DETAIL_CLAIM_DISCIPLINE } from "@/lib/findings/finding-detail-evidence-copy";
import { FindingPolicyCitationHero } from "@/components/findings/FindingPolicyCitationHero";
import { ProductLearningFeedbackControls } from "@/components/ProductLearningFeedbackControls";
import { FindingAskInlinePanel } from "@/components/findings/FindingAskInlinePanel";
import { FindingInspectItsmWorkflowPanel } from "../FindingInspectItsmWorkflowPanel";
import { FindingProvenancePanel } from "@/components/findings/FindingProvenancePanel";
import { phiMinimizationBuyerConsequenceNarrative } from "@/lib/findings/finding-display-from-inspect";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { DESIGN_TOKENS, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  resolveFindingDetailWorkflowEmphasizedStepId,
  resolveFindingDetailWorkflowSteps,
  resolveFindingDetailWorkflowTraceReadyFromPayload,
} from "@/lib/finding-detail-workflow-checklist";

import { FindingInspectAuditSection } from "../FindingInspectAuditSection";
import { FindingInspectEvidenceSection } from "../FindingInspectEvidenceSection";
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
            <CollapsibleSection
              title="Evidence"
              defaultOpen={false}
              sectionTestId="finding-evidence-collapsible"
              summaryLine={evidenceBasisSummary}
            >
              <FindingInspectEvidenceSection
                demoFillGaps={demoFillGaps}
                reviewContextHref={reviewPackageHref}
                reviewContextLabel="Open review summary"
                evidence={inspectPayload.evidence}
                citationModel={policyProvenanceModel}
              />
            </CollapsibleSection>
          ) : null}

          <CollapsibleSection
            title="Audit"
            defaultOpen={false}
            summaryLine={validationRequirement(inspectPayload, decodedFindingId)}
          >
            <p className={cn("m-0 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {validationRequirement(inspectPayload, decodedFindingId)}
            </p>
            {inspectPayload !== null ? (
              <div className="mt-4">
                <FindingInspectAuditSection
                  auditRowId={inspectPayload.auditRowId}
                  demoFillGaps={demoFillGaps}
                />
              </div>
            ) : null}
          </CollapsibleSection>

          {inspectPayload !== null ? (
            <FindingExplainabilityTracePanel
              runId={runId}
              findingId={decodedFindingId}
              buyerPolishedShell
              defaultCollapsed
              graphEvidenceHref={graphEvidenceHref}
              linkedManifestHref={linkedManifestHref}
            />
          ) : null}

          <CollapsibleSection
            title="Related audit record"
            defaultOpen={false}
            summaryLine="Redacted LLM audit and feedback when generated for this finding."
          >
            <FindingExplainPanel
              runId={runId}
              findingId={findingIdRouteParam}
              confidenceLevel={inspectPayload?.confidenceLevel ?? null}
              buyerPolishedShell
              graphEvidenceHref={graphEvidenceHref}
              linkedManifestHref={linkedManifestHref}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Technical metadata"
            defaultOpen={false}
            summaryLine={evidenceBasisSummary}
          >
            <dl className={cn("m-0 grid gap-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              <div>
                <dt className={cn("text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>Finding id</dt>
                <dd className="m-0 mt-1 flex flex-wrap items-center gap-2">
                  <code
                    className={cn(
                      "max-w-full break-all rounded bg-neutral-100 px-1.5 py-0.5 font-mono dark:bg-neutral-800",
                      OPERATOR_TYPOGRAPHY.micro,
                    )}
                  >
                    {decodedFindingId}
                  </code>
                  <CopyIdButton value={decodedFindingId} aria-label="Copy finding ID" />
                </dd>
              </div>
              {inspectPayload?.decisionRuleId ? (
                <div>
                  <dt className={cn("text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>Technical rule identifier</dt>
                  <dd className="m-0 mt-1 flex flex-wrap items-center gap-2">
                    <code
                      className={cn(
                        "max-w-full break-all rounded bg-neutral-100 px-1.5 py-0.5 font-mono dark:bg-neutral-800",
                        OPERATOR_TYPOGRAPHY.micro,
                      )}
                    >
                      {inspectPayload.decisionRuleId}
                    </code>
                    <CopyIdButton value={inspectPayload.decisionRuleId} aria-label="Copy rule identifier" />
                  </dd>
                </div>
              ) : null}
              {inspectPayload?.manifestVersion ? (
                <div>
                  <dt className={cn("text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>Review record version</dt>
                  <dd className={cn("m-0 mt-1 font-mono", OPERATOR_TYPOGRAPHY.micro)}>{inspectPayload.manifestVersion}</dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-4">
              <CollapsibleSection title="Evidence basis" defaultOpen={false} summaryLine={evidenceBasisSummary}>
                <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{evidenceBasisSummary}</p>
              </CollapsibleSection>
            </div>
            <div className="mt-4">
              <CollapsibleSection title="Full evidence trace" defaultOpen={false}>
                <FindingProvenancePanel runId={runId} findingId={decodedFindingId} />
              </CollapsibleSection>
            </div>
          </CollapsibleSection>

          {inspectPayload !== null ? (
            <CollapsibleSection title="Export finding" defaultOpen={false} summaryLine="Copy for Jira, Azure Boards, or ServiceNow">
              <FindingItsmExportPanel runId={runId} findingId={decodedFindingId} payload={inspectPayload} />
            </CollapsibleSection>
          ) : null}

          {inspectPayload !== null ? (
            <CollapsibleSection
              title="Work with this finding"
              defaultOpen={false}
              summaryLine="Ask, ITSM workflow, and feedback"
            >
              <div className="space-y-4">
                <FindingAskInlinePanel findingId={decodedFindingId} runId={runId} />
                <FindingInspectItsmWorkflowPanel findingId={decodedFindingId} />
                {isOperatorExperienceFullShellEnv() ? (
                  <ProductLearningFeedbackControls
                    runId={runId}
                    manifestVersion={inspectPayload.manifestVersion}
                    subjectType="Finding"
                    artifactHint={`finding:${decodedFindingId}`}
                    patternKey={inspectPayload.decisionRuleId ? `finding-rule:${inspectPayload.decisionRuleId}` : "finding"}
                    detail={{
                      findingId: decodedFindingId,
                      decisionRuleId: inspectPayload.decisionRuleId,
                    }}
                    title="Was this finding useful?"
                  />
                ) : null}
              </div>
            </CollapsibleSection>
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
