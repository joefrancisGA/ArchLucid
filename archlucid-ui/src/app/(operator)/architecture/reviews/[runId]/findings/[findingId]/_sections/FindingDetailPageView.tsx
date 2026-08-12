import { cn } from "@/lib/utils";
import Link from "next/link";

import { FindingInspectContextDebugPanel } from "@/components/findings/FindingInspectContextDebugPanel";
import { FindingOptionalArtifactUnavailable } from "@/components/findings/FindingOptionalArtifactUnavailable";
import { FindingProvenancePanel } from "@/components/findings/FindingProvenancePanel";
import { ProductLearningFeedbackControls } from "@/components/ProductLearningFeedbackControls";
import { FindingAskInlinePanel } from "@/components/FindingAskInlinePanel";
import { FindingIacStubPanel } from "@/components/FindingIacStubPanel";
import { FindingPolicyCitationHero } from "@/components/findings/FindingPolicyCitationHero";
import { FindingItsmExportPanel } from "@/components/FindingItsmExportPanel";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import { FindingConfidenceBadge } from "@/components/FindingConfidenceBadge";
import { FindingExplainPanel } from "@/components/FindingExplainPanel";
import { SponsorPlainEnglishFindingPanel } from "@/components/findings/SponsorPlainEnglishFindingPanel";
import { FindingExplainabilityTracePanel } from "@/components/FindingExplainabilityTracePanel";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorEvidenceLimitsFooter } from "@/components/OperatorEvidenceLimitsFooter";
import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import {
  findingDetailLeadSentence,
  findingDetailPageEyebrow,
  findingInspectNarrativeFields,
  findingInspectPrimaryLabels,
  findingWhyThisMattersText,
  phiMinimizationBuyerConsequenceNarrative,
} from "@/lib/findings/finding-display-from-inspect";
import { buildFindingDerivationSentence } from "@/lib/findings/finding-derivation-sentence";
import { findingCausalMiniChainFromInspectPayload } from "@/lib/findings/finding-causal-mini-chain";
import { FindingDerivationLine } from "@/components/usability/FindingDerivationLine";
import { FindingCausalMiniChain } from "@/components/usability/FindingCausalMiniChain";
import { findingSeverityAudienceCopy } from "@/lib/findings/finding-explainability-summary";
import { getShowcaseManifestHref } from "@/lib/buyer-safe-review-navigation";
import { isNextPublicDemoMode, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { isDemoRunIdEligibleForStaticFallback } from "@/lib/operator-static-demo";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { getFindingEvidenceTraceHref } from "@/lib/findings/finding-evidence-navigation";
import { graphEvidenceHrefFromInspect } from "@/lib/findings/finding-inspect-graph-evidence";
import {
  buildFindingPolicyEvidenceCitationsFromInspect,
  resolvePolicyTraceExcerptFromInspect,
} from "@/lib/findings/finding-policy-evidence-citations";

import { FindingInspectAuditSection } from "../FindingInspectAuditSection";
import { FindingInspectEvidenceSection } from "../FindingInspectEvidenceSection";
import { FindingInspectFindingBody } from "../FindingInspectFindingBody";
import { FindingInspectItsmWorkflowPanel } from "../FindingInspectItsmWorkflowPanel";
import { FindingInspectRecommendedActionSection } from "../FindingInspectRecommendedActionSection";
import { FindingInspectWhyMattersSection } from "../FindingInspectWhyMattersSection";
import { FindingDetailDecisionSummary } from "./FindingDetailDecisionSummary";
import { FindingDetailOperationalActions } from "./FindingDetailOperationalActions";
import { FindingDetailWayfinding } from "./FindingDetailWayfinding";
import {
  deriveFindingDecisionSummary,
  fallbackSeverity,
  findingDetailLeadFallback,
  findingRecommendedActionParagraph,
  findingStatusTagKind,
  summarizeEvidenceBasis,
  validationRequirement,
} from "./finding-detail-route-display";
import type { FindingDetailPageModel } from "./finding-detail-page-model";

type Props = {
  readonly model: FindingDetailPageModel;
};

/** Finding detail layout: buyer-polished hero vs operator header, body, export, footer. */
export function FindingDetailPageView(props: Props) {
  const model = props.model;
  const {
    runId,
    findingIdRouteParam,
    decodedFindingId,
    inspectPayload,
    inspectFailure,
    buyerPolishedShell,
    linkedManifestHref,
    pageTitle,
    findingIsPhi,
    runExecutionFootnote,
  } = model;

  const labels = inspectPayload !== null ? findingInspectPrimaryLabels(inspectPayload) : null;

  const graphEvidenceHref =
    inspectPayload !== null
      ? graphEvidenceHrefFromInspect(runId, decodedFindingId, inspectPayload)
      : null;

  const severityHeadline = fallbackSeverity(inspectPayload, decodedFindingId);
  const severityRationale =
    severityHeadline.trim().length > 0 ? findingSeverityAudienceCopy(severityHeadline).meaningForOperators : "";

  const confidenceLevel = inspectPayload?.confidenceLevel ?? null;
  const evaluationScore = inspectPayload?.evaluationConfidenceScore ?? null;
  const policyProvenanceModel =
    inspectPayload !== null
      ? buildFindingPolicyEvidenceCitationsFromInspect(runId, decodedFindingId, inspectPayload)
      : null;
  const policyTraceExcerpt =
    inspectPayload !== null ? resolvePolicyTraceExcerptFromInspect(inspectPayload) : null;

  const inspectHref = getFindingEvidenceTraceHref(runId, decodedFindingId);
  const reviewFindingsHref = `/architecture/reviews/${encodeURIComponent(runId)}?reviewTab=findings`;
  const reviewPackageHref = isDemoRunIdEligibleForStaticFallback(runId)
    ? getShowcaseManifestHref()
    : `/architecture/reviews/${encodeURIComponent(runId)}`;
  const decisionSummary =
    inspectPayload !== null ? deriveFindingDecisionSummary(inspectPayload, decodedFindingId) : null;
  const evidenceBasisSummary = summarizeEvidenceBasis(inspectPayload);
  const demoFillGaps =
    (isNextPublicDemoMode() || isDemoRunIdEligibleForStaticFallback(runId)) && isOperatorExperienceFullShellEnv();
  const whyThisMattersNarrative = inspectPayload !== null ? findingWhyThisMattersText(inspectPayload) : null;
  const buyerStructuredActions =
    inspectPayload !== null
      ? (inspectPayload.recommendedActions ?? []).filter((action) => action.trim().length > 0)
      : [];
  const buyerRecommendedActionParagraph =
    inspectPayload !== null ? findingRecommendedActionParagraph(inspectPayload, decodedFindingId) : null;
  const sponsorPlainEnglishInput =
    inspectPayload !== null
      ? (() => {
          const narrative = findingInspectNarrativeFields(inspectPayload);
          const derivation = buildFindingDerivationSentence({
            ruleName: inspectPayload.decisionRuleName,
            ruleId: inspectPayload.decisionRuleId,
            severityLabel: severityHeadline,
            evidenceRefCount: inspectPayload.evidence?.length ?? 0,
            reasoningSummary: inspectPayload.reasoningSummary,
          });

          return {
            title: pageTitle,
            message: narrative.description ?? findingDetailLeadSentence(inspectPayload),
            severity: severityHeadline,
            derivationSentence: derivation.sentence,
            residualRisk: null as string | null,
          };
        })()
      : {
          title: pageTitle,
          message: findingDetailLeadFallback(decodedFindingId),
          severity: severityHeadline,
          derivationSentence: null as string | null,
          residualRisk: null as string | null,
        };
  const showBuyerPolishedBody = buyerPolishedShell && inspectFailure === null;

  return (
    <div className="w-full max-w-[1440px] space-y-4 p-4">
      <FindingDetailWayfinding
        reviewPackageHref={reviewPackageHref}
        reviewFindingsHref={reviewFindingsHref}
        currentPageLabel={pageTitle}
      />
      {inspectPayload !== null ? (
        <div className="space-y-2" data-testid="finding-detail-derivation-causal">
          <FindingDerivationLine
            derivation={buildFindingDerivationSentence({
              ruleName: inspectPayload.decisionRuleName,
              ruleId: inspectPayload.decisionRuleId,
              severityLabel: severityHeadline,
              evidenceRefCount: inspectPayload.evidence?.length ?? 0,
              reasoningSummary: inspectPayload.reasoningSummary,
            })}
            evidenceHref={inspectHref}
          />
          <FindingCausalMiniChain chain={findingCausalMiniChainFromInspectPayload(inspectPayload)} />
        </div>
      ) : null}
{showBuyerPolishedBody ? (
        <div className="space-y-4">
          <section className={cn("overflow-hidden rounded-lg border p-5", DESIGN_TOKENS.surface.card)}>
            <div className="max-w-3xl space-y-3">
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>
                {findingDetailPageEyebrow(inspectPayload, decodedFindingId)}
              </p>
              <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>{pageTitle}</h1>
              <p className={cn("m-0 max-w-2xl leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {inspectPayload !== null
                  ? findingDetailLeadSentence(inspectPayload)
                  : findingDetailLeadFallback(decodedFindingId)}
              </p>
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
            />
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
              structuredActions={buyerStructuredActions}
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
                <FindingAskInlinePanel findingId={decodedFindingId} />
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
      ) : !buyerPolishedShell ? (
        <header className="space-y-3">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>
            Finding detail
          </p>
          <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>{pageTitle}</h1>

          {policyProvenanceModel !== null &&
          (policyProvenanceModel.pack !== null || policyProvenanceModel.policy !== null) ? (
            <FindingPolicyCitationHero model={policyProvenanceModel} traceExcerpt={policyTraceExcerpt} />
          ) : null}

          {labels !== null ? (
            <div className="flex flex-wrap items-center gap-2">
              {labels.severityLabel ? <SeverityTag severity={labels.severityLabel} /> : null}
              {labels.statusLabel ? (
                <StatusTag kind={findingStatusTagKind(labels.statusLabel)} label={labels.statusLabel} />
              ) : null}
              {labels.categoryLabel ? (
                <StatusTag kind="neutral" label={labels.categoryLabel} />
              ) : null}
              {labels.impactedAreaLabel ? (
                <StatusTag kind="neutral" label={`Business impact: ${labels.impactedAreaLabel}`} />
              ) : null}
            </div>
          ) : null}

          {inspectPayload !== null &&
          (confidenceLevel === "High" || confidenceLevel === "Medium" || confidenceLevel === "Low") ? (
            <div className="flex flex-wrap items-center gap-2">
              <FindingConfidenceBadge level={confidenceLevel} />
              {evaluationScore !== null && Number.isFinite(evaluationScore) ? (
                <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Score {evaluationScore.toFixed(2)}
                </span>
              ) : null}
            </div>
          ) : null}

          {inspectPayload !== null && severityRationale.length > 0 ? (
            <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{severityRationale}</p>
          ) : null}

          {graphEvidenceHref !== null ? (
            <p className="m-0">
              <Link className={OPERATOR_LINK.nav} href={graphEvidenceHref}>
                View evidence trail
              </Link>
            </p>
          ) : null}

          {inspectPayload !== null ? (
            <p className={cn("m-0 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {findingDetailLeadSentence(inspectPayload)}
            </p>
          ) : null}
        </header>
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

      {inspectPayload !== null && !buyerPolishedShell ? (
        <FindingAskInlinePanel findingId={decodedFindingId} />
      ) : null}

      {inspectPayload !== null && !buyerPolishedShell ? (
        <FindingIacStubPanel runId={runId} findingId={decodedFindingId} />
      ) : null}

      {inspectPayload !== null && !buyerPolishedShell ? (
        <FindingInspectItsmWorkflowPanel findingId={decodedFindingId} />
      ) : null}

      {inspectPayload !== null && !buyerPolishedShell ? (
        <CollapsibleSection title="Export finding" defaultOpen={false} summaryLine="Copy for Jira, Azure Boards, or ServiceNow">
          <FindingItsmExportPanel runId={runId} findingId={decodedFindingId} payload={inspectPayload} />
        </CollapsibleSection>
      ) : null}

      {inspectPayload !== null && !buyerPolishedShell ? (
        <CollapsibleSection title="Technical identifiers" defaultOpen={false}>
          <dl className={cn("m-0 grid gap-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            <div>
              <dt className={cn("text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>
                Finding id
              </dt>
              <dd className="m-0 mt-1 flex flex-wrap items-center gap-2">
                <code className={cn("max-w-full break-all rounded bg-neutral-100 px-1.5 py-0.5 font-mono dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.micro)}>
                  {decodedFindingId}
                </code>
                <CopyIdButton value={decodedFindingId} aria-label="Copy finding ID" />
              </dd>
            </div>
            {inspectPayload.manifestVersion ? (
              <div>
                <dt className={cn("text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>
                  Review record version
                </dt>
                <dd className={cn("m-0 mt-1 font-mono", OPERATOR_TYPOGRAPHY.micro)}>{inspectPayload.manifestVersion}</dd>
              </div>
            ) : null}
          </dl>
        </CollapsibleSection>
      ) : null}

      {inspectPayload !== null && !buyerPolishedShell ? (
        <CollapsibleSection
          title="Technical audit trail"
          defaultOpen={false}
        >
          <FindingExplainPanel
            runId={runId}
            findingId={findingIdRouteParam}
            confidenceLevel={inspectPayload?.confidenceLevel ?? null}
            graphEvidenceHref={graphEvidenceHref}
            linkedManifestHref={linkedManifestHref}
          />
        </CollapsibleSection>
      ) : null}

      <OperatorEvidenceLimitsFooter
        runId={runId}
        findingIdForInspectLink={buyerPolishedShell ? null : decodedFindingId}
        execution={runExecutionFootnote}
        inspectMetadata={
          inspectPayload !== null
            ? {
                modelDeploymentName: inspectPayload.modelDeploymentName ?? null,
                modelAlias: inspectPayload.modelAlias ?? null,
                promptTemplateVersion: inspectPayload.promptTemplateVersion ?? null,
              }
            : null
        }
      />
    </div>
  );
}
