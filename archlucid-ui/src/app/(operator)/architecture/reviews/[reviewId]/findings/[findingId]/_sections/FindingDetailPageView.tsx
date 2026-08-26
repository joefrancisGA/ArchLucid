import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { findingInspectPrimaryLabels, findingWhyThisMattersText, findingDetailLeadSentence } from "@/lib/findings/finding-display-from-inspect";
import { buildFindingDerivationSentence } from "@/lib/findings/finding-derivation-sentence";
import { findingSeverityAudienceCopy } from "@/lib/findings/finding-explainability-summary";
import { getShowcaseManifestHref } from "@/lib/buyer/buyer-safe-review-navigation";
import { isNextPublicDemoMode, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { isDemoRunIdEligibleForStaticFallback } from "@/lib/operator/operator-static-demo";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { getFindingEvidenceTraceHref } from "@/lib/findings/finding-evidence-navigation";
import { graphEvidenceHrefFromInspect } from "@/lib/findings/finding-inspect-graph-evidence";
import {
  buildFindingPolicyEvidenceCitationsFromInspect,
  resolvePolicyTraceExcerptFromInspect,
} from "@/lib/findings/finding-policy-evidence-citations";
import { buildSeverityConstraintNoteForInspectPayload } from "@/lib/review-quality/finding-severity-constraint-note";
import { classifyInspectPayloadJobView } from "@/lib/findings/finding-inspect-job-view";
import { findingInspectNarrativeFields } from "@/lib/findings/finding-display-from-inspect";

import {
  deriveFindingDecisionSummary,
  fallbackSeverity,
  findingDetailLeadFallback,
  findingRecommendedActionParagraph,
  summarizeEvidenceBasis,
} from "./finding-detail-route-display";
import type { FindingDetailPageModel } from "./finding-detail-page-model";
import { FindingDetailActions } from "./FindingDetailActions";
import { FindingDetailHeader } from "./FindingDetailHeader";
import { FindingDetailInspectBody } from "./FindingDetailInspectBody";
import type { FindingDetailPresentation } from "./finding-detail-presentation";

type Props = {
  readonly model: FindingDetailPageModel;
  readonly crossReviewPriorRunId?: string | null;
  readonly crossReviewLaterRunId?: string | null;
};

/** Finding detail layout: buyer-polished hero vs operator header, body, export, footer. */
export function FindingDetailPageView(props: Props) {
  const model = props.model;
  const crossReviewPriorRunId = props.crossReviewPriorRunId ?? null;
  const crossReviewLaterRunId = props.crossReviewLaterRunId ?? null;
  const {
    runId,
    findingIdRouteParam,
    decodedFindingId,
    inspectPayload,
    inspectFailure,
    buyerPolishedShell,
    linkedManifestHref,
    pageTitle,
    statedConstraintContext,
  } = model;

  const labels = inspectPayload !== null ? findingInspectPrimaryLabels(inspectPayload) : null;

  const graphEvidenceHref =
    inspectPayload !== null
      ? graphEvidenceHrefFromInspect(runId, decodedFindingId, inspectPayload)
      : null;

  const severityHeadline = fallbackSeverity(inspectPayload, decodedFindingId);
  const severityRationale =
    severityHeadline.trim().length > 0 ? findingSeverityAudienceCopy(severityHeadline).meaningForOperators : "";
  const severityConstraintNote =
    inspectPayload !== null
      ? buildSeverityConstraintNoteForInspectPayload(inspectPayload, statedConstraintContext)
      : null;
  const findingJobView =
    inspectPayload !== null ? classifyInspectPayloadJobView(inspectPayload) : null;

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
  const buyerHeroSubtitle =
    inspectPayload !== null
      ? findingDetailLeadSentence(inspectPayload)
      : findingDetailLeadFallback(decodedFindingId);

  const presentation: FindingDetailPresentation = {
    model,
    crossReviewPriorRunId,
    crossReviewLaterRunId,
    labels,
    graphEvidenceHref,
    severityHeadline,
    severityRationale,
    severityConstraintNote,
    findingJobView,
    confidenceLevel,
    evaluationScore,
    policyProvenanceModel,
    policyTraceExcerpt,
    inspectHref,
    reviewFindingsHref,
    reviewPackageHref,
    linkedManifestHref,
    decisionSummary,
    evidenceBasisSummary,
    demoFillGaps,
    whyThisMattersNarrative,
    buyerStructuredActions,
    buyerRecommendedActionParagraph,
    sponsorPlainEnglishInput,
    showBuyerPolishedBody,
    buyerHeroSubtitle,
  };

  return (
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack}>
      <FindingDetailHeader
        showBuyerPolishedBody={showBuyerPolishedBody}
        buyerPolishedShell={buyerPolishedShell}
        reviewPackageHref={reviewPackageHref}
        reviewFindingsHref={reviewFindingsHref}
        pageTitle={pageTitle}
        runId={runId}
        decodedFindingId={decodedFindingId}
        crossReviewPriorRunId={crossReviewPriorRunId}
        crossReviewLaterRunId={crossReviewLaterRunId}
        inspectPayload={inspectPayload}
        policyProvenanceModel={policyProvenanceModel}
        policyTraceExcerpt={policyTraceExcerpt}
        severityRationale={severityRationale}
        severityHeadline={severityHeadline}
        labels={labels}
        confidenceLevel={confidenceLevel}
        evaluationScore={evaluationScore}
        severityConstraintNote={severityConstraintNote}
        findingJobView={findingJobView}
        graphEvidenceHref={graphEvidenceHref}
        inspectHref={inspectHref}
      />
      <FindingDetailInspectBody presentation={presentation} />
      <FindingDetailActions presentation={presentation} />
    </OperatorPageContainer>
  );
}
