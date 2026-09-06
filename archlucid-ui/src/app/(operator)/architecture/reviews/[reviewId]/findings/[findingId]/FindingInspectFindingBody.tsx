import type { ReactElement } from "react";

import { cn } from "@/lib/utils";


import { ProductLearningFeedbackControls } from "@/components/ProductLearningFeedbackControls";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { getShowcaseManifestHref } from "@/lib/buyer/buyer-safe-review-navigation";
import { isDemoRunIdEligibleForStaticFallback } from "@/lib/operator/operator-static-demo";
import type { FindingInspectPayload } from "@/types/finding-inspect";
import { findingWhyThisMattersText, typedPayloadLookupString } from "@/lib/findings/finding-display-from-inspect";
import { buildFindingModelProvenanceRow } from "@/lib/findings/finding-model-provenance-display";
import { buildFindingPolicyEvidenceCitationsFromInspect } from "@/lib/findings/finding-policy-evidence-citations";
import { FindingInsightDensityDisclosure } from "@/components/usability/FindingInsightDensityDisclosure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { FindingInspectAuditSection } from "./FindingInspectAuditSection";
import { FindingInspectEvidenceSection } from "./FindingInspectEvidenceSection";
import { FindingInspectReasoningPayloadDetails } from "./FindingInspectReasoningPayloadDetails";
import { FindingInspectReasoningSummarySection } from "./FindingInspectReasoningSummarySection";
import { FindingInspectRecommendedActionSection } from "./FindingInspectRecommendedActionSection";
import { FindingInspectWhyMattersSection } from "./FindingInspectWhyMattersSection";
import { FindingInspectViewEvidenceCollapsible } from "./FindingInspectViewEvidenceCollapsible";
import { findingRecommendedActionParagraph } from "./_sections/finding-detail-route-display";

export type FindingInspectFindingBodyProps = {
  readonly runId: string;
  readonly decodedFindingId: string;
  readonly payload: FindingInspectPayload;
  readonly variant?: "detail" | "inspect";
  /** When `sponsor`, omit operator audit linkage and use sponsor review handoffs. */
  readonly surface?: "operator" | "sponsor";
};

/**
 * Finding narrative + traceability blocks composed by route:
 * - **detail** — sponsor report first; omits raw reasoning / typed JSON (use Inspect for deep traceability).
 * - **inspect** — full ordered traceability including reasoning and structured payload dumps.
 */
export function FindingInspectFindingBody({
  runId,
  decodedFindingId,
  payload,
  variant = "inspect",
  surface = "operator",
}: FindingInspectFindingBodyProps): ReactElement {
  const demoFillGaps =
    (isNextPublicDemoMode() || isDemoRunIdEligibleForStaticFallback(runId)) && isOperatorExperienceFullShellEnv();
  const reviewContextHref =
    surface === "sponsor"
      ? `/architecture/reviews/${encodeURIComponent(runId)}`
      : isDemoRunIdEligibleForStaticFallback(runId)
        ? getShowcaseManifestHref()
        : `/architecture/reviews/${encodeURIComponent(runId)}`;
  const reviewContextLabel =
    surface === "sponsor"
      ? "Open risk review"
      : "Open review summary";
  const citationModel = buildFindingPolicyEvidenceCitationsFromInspect(runId, decodedFindingId, payload);
  const whyThisMattersNarrative = findingWhyThisMattersText(payload);

  let insightDensityScore: number | null = null;

  if (payload.typedPayload !== null && typeof payload.typedPayload === "object") {
    const scoreRaw = (payload.typedPayload as Record<string, unknown>).insightDensityScore;

    if (typeof scoreRaw === "number" && Number.isFinite(scoreRaw)) {
      insightDensityScore = Math.trunc(scoreRaw);
    } else if (typeof scoreRaw === "string") {
      const parsed = Number.parseInt(scoreRaw, 10);

      if (!Number.isNaN(parsed)) {
        insightDensityScore = parsed;
      }
    }
  }

  const whyThisIsNotGeneric = typedPayloadLookupString(payload, "whyThisIsNotGeneric");

  const evidenceRefCount = payload.evidence?.length ?? 0;
  const modelProvenance = buildFindingModelProvenanceRow({
    trustLabel: payload.trustLabel ?? typedPayloadLookupString(payload, "trustLabel"),
    trustLabelReason: payload.trustLabelReason ?? typedPayloadLookupString(payload, "trustLabelReason"),
    policyRuleId: payload.decisionRuleId,
    evidenceRefCount,
    confidenceLevel: typedPayloadLookupString(payload, "confidenceLevel"),
  });

  const modelProvenanceBlock = (
    <div className="mt-4 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800" data-testid="finding-model-provenance-row">
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Model provenance</p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        {modelProvenance.origin}
        {modelProvenance.grounding !== "Not applicable" ? ` · ${modelProvenance.grounding}` : ""}
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{modelProvenance.explanation}</p>
      {modelProvenance.trustLabelReason !== null ? (
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{modelProvenance.trustLabelReason}</p>
      ) : null}
    </div>
  );

  const structuredActions: string[] = (payload.recommendedActions ?? []).filter((a) => a.trim().length > 0);
  const recommendedActionParagraph = findingRecommendedActionParagraph(payload, decodedFindingId);

  const whyBlock = (
    <FindingInspectWhyMattersSection
      payload={payload}
      variant={variant}
      demoFillGaps={demoFillGaps}
      whyThisMattersNarrative={whyThisMattersNarrative}
    />
  );

  const reasoningSummaryText = payload.reasoningSummary?.trim() ?? "";
  const reasoningSummaryBlock =
    variant === "inspect" && reasoningSummaryText.length > 0 ? (
      <FindingInspectReasoningSummarySection text={reasoningSummaryText} />
    ) : null;

  const evidenceBlock = (
    <FindingInspectEvidenceSection
      demoFillGaps={demoFillGaps}
      reviewContextHref={reviewContextHref}
      reviewContextLabel={reviewContextLabel}
      evidence={payload.evidence}
      citationModel={citationModel}
    />
  );

  const insightDensityBlock = (
    <FindingInsightDensityDisclosure
      insightDensityScore={
        insightDensityScore !== null && Number.isFinite(insightDensityScore) ? insightDensityScore : null
      }
      whyThisIsNotGeneric={whyThisIsNotGeneric}
      className="mt-4"
    />
  );

  const recommendedBlock = (tone: "detail" | "inspect") => (
    <FindingInspectRecommendedActionSection
      tone={tone}
      structuredActions={structuredActions}
      recommendedActionParagraph={recommendedActionParagraph}
      showOwnerCadence={tone === "detail" && isBuyerPolishedOperatorShellEnv()}
    />
  );

  const auditBlock =
    surface === "sponsor" ? null : (
      <FindingInspectAuditSection auditRowId={payload.auditRowId} demoFillGaps={demoFillGaps} />
    );

  const feedbackBlock =
    variant === "detail" && isOperatorExperienceFullShellEnv() ? (
      <ProductLearningFeedbackControls
        runId={runId}
        manifestVersion={payload.manifestVersion}
        subjectType="Finding"
        artifactHint={`finding:${decodedFindingId}`}
        patternKey={payload.decisionRuleId ? `finding-rule:${payload.decisionRuleId}` : "finding"}
        detail={{
          findingId: decodedFindingId,
          decisionRuleId: payload.decisionRuleId,
        }}
        title="Was this finding useful?"
      />
    ) : null;

  if (variant === "detail") {
    return (
      <>
        {whyBlock}
        {modelProvenanceBlock}
        <FindingInspectViewEvidenceCollapsible>{evidenceBlock}</FindingInspectViewEvidenceCollapsible>
        {insightDensityBlock}
        {recommendedBlock("detail")}
        {feedbackBlock}
        {auditBlock}
      </>
    );
  }

  return (
    <>
      {whyBlock}
      {modelProvenanceBlock}
      {reasoningSummaryBlock}
      {evidenceBlock}
      {insightDensityBlock}
      {recommendedBlock("inspect")}
      <FindingInspectReasoningPayloadDetails
        runId={runId}
        findingId={decodedFindingId}
        reasoningTrace={payload.reasoningTrace}
        typedPayload={payload.typedPayload}
        lazyLoadTypedPayload
      />
      {auditBlock}
    </>
  );
}
