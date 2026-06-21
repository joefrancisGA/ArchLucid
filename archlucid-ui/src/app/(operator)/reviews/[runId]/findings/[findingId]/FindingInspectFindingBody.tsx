import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { ProductLearningFeedbackControls } from "@/components/ProductLearningFeedbackControls";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { getShowcaseManifestHref } from "@/lib/buyer-safe-review-navigation";
import { isDemoRunIdEligibleForStaticFallback } from "@/lib/operator-static-demo";
import type { FindingInspectPayload } from "@/types/finding-inspect";
import { findingInspectPrimaryLabels, findingWhyThisMattersText, phiMinimizationRecommendedActionFallback } from "@/lib/finding-display-from-inspect";

import { FindingInspectAuditSection } from "./FindingInspectAuditSection";
import { FindingInspectEvidenceSection } from "./FindingInspectEvidenceSection";
import { FindingInsightDensityDisclosure } from "@/components/usability/FindingInsightDensityDisclosure";
import { typedPayloadLookupString } from "@/lib/finding-display-from-inspect";
import { FindingInspectReasoningPayloadDetails } from "./FindingInspectReasoningPayloadDetails";
import { FindingInspectReasoningSummarySection } from "./FindingInspectReasoningSummarySection";
import { FindingInspectRecommendedActionSection } from "./FindingInspectRecommendedActionSection";
import { FindingInspectWhyMattersSection } from "./FindingInspectWhyMattersSection";

export type FindingInspectFindingBodyProps = {
  readonly runId: string;
  readonly decodedFindingId: string;
  readonly payload: FindingInspectPayload;
  readonly variant?: "detail" | "inspect";
  /** When `executive`, omit operator audit linkage and use executive review handoffs. */
  readonly surface?: "operator" | "executive";
};

/**
 * Finding narrative + traceability blocks composed by route:
 * - **detail** — sponsor summary first; omits raw reasoning / typed JSON (use Inspect for deep traceability).
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
    (isNextPublicDemoMode() || isDemoRunIdEligibleForStaticFallback(runId)) && !isBuyerPolishedOperatorShellEnv();
  const reviewContextHref =
    surface === "executive"
      ? `/executive/reviews/${encodeURIComponent(runId)}`
      : isDemoRunIdEligibleForStaticFallback(runId)
        ? getShowcaseManifestHref()
        : `/reviews/${encodeURIComponent(runId)}`;
  const reviewContextLabel =
    surface === "executive"
      ? "Open risk review"
      : isDemoRunIdEligibleForStaticFallback(runId)
        ? "Open cited evidence"
        : "Open review detail (artifacts & graph)";
  const labels = findingInspectPrimaryLabels(payload);
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

  const structuredActions: string[] = (payload.recommendedActions ?? []).filter((a) => a.trim().length > 0);
  const recommendedActionParagraph =
    labels.recommendedAction ??
    (isBuyerPolishedOperatorShellEnv()
      ? phiMinimizationRecommendedActionFallback()
      : "Review evidence and rationale above. Consult the finding category and primary rule to determine the appropriate remediation path.");

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
    surface === "executive" ? null : (
      <FindingInspectAuditSection auditRowId={payload.auditRowId} demoFillGaps={demoFillGaps} />
    );

  const feedbackBlock =
    variant === "detail" && !isBuyerPolishedOperatorShellEnv() ? (
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
        <CollapsibleSection title="View evidence" defaultOpen={false} sectionTestId="finding-evidence-collapsible">
          {evidenceBlock}
        </CollapsibleSection>
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
      {reasoningSummaryBlock}
      {evidenceBlock}
      {insightDensityBlock}
      {recommendedBlock("inspect")}
      <FindingInspectReasoningPayloadDetails
        reasoningTrace={payload.reasoningTrace}
        typedPayload={payload.typedPayload}
      />
      {auditBlock}
    </>
  );
}
