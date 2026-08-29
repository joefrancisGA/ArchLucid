import {
  BUYER_FINDING_POST_APPROVAL_LEAD,
  BUYER_FINDING_POST_APPROVAL_VALIDATION,
  BUYER_SHOWCASE_RESIDUAL_RISK_MONITORING_CADENCE,
  resolveBuyerShowcaseResidualRiskNextReviewIso,
  BUYER_SHOWCASE_RESIDUAL_RISK_OWNER,
} from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  getActiveSampleScenario,
  isActiveSampleHeroFindingId,
  isSampleHeroFindingReferenceId,
  resolveSampleScenarioByHeroFindingId,
  resolveSampleScenarioByRunId,
  sampleCategoryTokenMatches,
} from "@/lib/samples/registry";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import type { FindingInspectPayload } from "@/types/finding-inspect";

/**
 * Reads common optional typed-payload shapes (demo + rule engines) without assuming a single schema.
 */
export function typedPayloadLookupString(payload: FindingInspectPayload, key: string): string | null {
  const value: unknown = payload.typedPayload;

  if (value === null || value === undefined || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (!(key in record)) {
    return null;
  }

  const extracted = record[key];

  if (typeof extracted !== "string" || extracted.trim().length === 0) {
    return null;
  }

  return extracted.trim();
}

/** Human-visible labels derived from persisted inspect payload — primary narrative before raw JSON/explanations. */
export function findingInspectPrimaryLabels(payload: FindingInspectPayload): {
  severityLabel: string | null;
  categoryLabel: string | null;
  impactedAreaLabel: string | null;
  recommendedAction: string | null;
  statusLabel: string | null;
} {
  return {
    severityLabel:
      typedPayloadLookupString(payload, "severity") ?? typedPayloadLookupString(payload, "Severity"),
    categoryLabel:
      typedPayloadLookupString(payload, "category") ??
      typedPayloadLookupString(payload, "Category") ??
      payload.decisionRuleName ??
      payload.decisionRuleId ??
      null,
    impactedAreaLabel:
      typedPayloadLookupString(payload, "impactedArea") ??
      typedPayloadLookupString(payload, "ImpactedArea") ??
      typedPayloadLookupString(payload, "impactArea"),
    recommendedAction:
      // Prefer structured actions from dbo.FindingRecommendedActions (populated by the finding engine).
      // Fall back to typed-payload JSON fields for legacy findings that pre-date the relational table.
      payload.recommendedActions.find((action) => action.trim().length > 0) ??
      typedPayloadLookupString(payload, "recommendedAction") ??
      typedPayloadLookupString(payload, "RecommendedAction") ??
      typedPayloadLookupString(payload, "remediationSuggestion"),
    statusLabel:
      typedPayloadLookupString(payload, "status") ??
      typedPayloadLookupString(payload, "Status") ??
      typedPayloadLookupString(payload, "findingStatus"),
  };
}

/** Title and description for work-item copy — common typed-payload shapes from finding engines. */
export function findingInspectNarrativeFields(payload: FindingInspectPayload): {
  title: string | null;
  description: string | null;
} {
  return {
    title:
      typedPayloadLookupString(payload, "title") ??
      typedPayloadLookupString(payload, "Title") ??
      typedPayloadLookupString(payload, "name") ??
      null,
    description:
      typedPayloadLookupString(payload, "description") ??
      typedPayloadLookupString(payload, "Description") ??
      typedPayloadLookupString(payload, "message") ??
      typedPayloadLookupString(payload, "Message") ??
      typedPayloadLookupString(payload, "detail") ??
      null,
  };
}

export function isPhiMinimizationFindingId(findingId: string | null | undefined): boolean {
  if (isSampleHeroFindingReferenceId(findingId)) {
    return true;
  }

  return sampleCategoryTokenMatches(findingId ?? "");
}

function resolveFindingSampleScenario(
  payload: FindingInspectPayload | null,
  findingId?: string | null,
): ReturnType<typeof getActiveSampleScenario> | null {
  if (payload !== null) {
    const byRun = resolveSampleScenarioByRunId(payload.runId);

    if (byRun !== null) {
      return byRun;
    }

    const byFinding = resolveSampleScenarioByHeroFindingId(payload.findingId);

    if (byFinding !== null) {
      return byFinding;
    }
  }

  if (findingId !== undefined && findingId !== null) {
    return resolveSampleScenarioByHeroFindingId(findingId);
  }

  return null;
}

function residualMinimizationRiskHeading(scenario: ReturnType<typeof getActiveSampleScenario> | null): string {
  if (scenario?.slug === "claims-intake") {
    return "Residual PHI minimization risk (monitored)";
  }

  return "Residual sensitive data minimization risk (monitored)";
}

function sampleHeroFindingEyebrowSuffix(scenario: ReturnType<typeof getActiveSampleScenario> | null): string {
  if (scenario?.slug === "claims-intake") {
    return "PHI minimization";
  }

  return "Sensitive data minimization";
}

/**
 * Preferred page title for Finding detail — human narrative first, then rule context, generic last.
 */
function isShowcasePrimaryPhiFindingId(findingId: string | null | undefined): boolean {
  return isSampleHeroFindingReferenceId(findingId) || isActiveSampleHeroFindingId(findingId);
}

export function findingDetailHeadingTitle(payload: FindingInspectPayload): string {
  const scenario =
    resolveSampleScenarioByHeroFindingId(payload.findingId) ??
    resolveSampleScenarioByRunId(payload.runId) ??
    getActiveSampleScenario();

  if (isShowcasePrimaryPhiFindingId(payload.findingId)) {
    return (resolveSampleScenarioByHeroFindingId(payload.findingId) ?? scenario).primaryFindingTitle;
  }

  if (isPhiMinimizationSampleFinding(payload)) {
    return residualMinimizationRiskHeading(resolveFindingSampleScenario(payload));
  }

  const narrative = findingInspectNarrativeFields(payload);
  const titleCandidate = narrative.title?.trim();

  if (titleCandidate !== undefined && titleCandidate.length > 0) {
    return titleCandidate;
  }

  const ruleName = payload.decisionRuleName?.trim();

  if (ruleName !== undefined && ruleName.length > 0) {
    return ruleName;
  }

  const ruleId = payload.decisionRuleId?.trim();

  if (ruleId !== undefined && ruleId.length > 0) {
    return ruleId;
  }

  return "Finding detail";
}

/** Route-aware title fallback used before / when the inspect payload is sparse. */
export function findingDetailHeadingTitleForRoute(
  findingId: string,
  payload: FindingInspectPayload | null
): string {
  const scenario =
    resolveSampleScenarioByHeroFindingId(findingId) ??
    (payload !== null ? resolveSampleScenarioByRunId(payload.runId) : null) ??
    getActiveSampleScenario();

  if (isShowcasePrimaryPhiFindingId(findingId)) {
    return (resolveSampleScenarioByHeroFindingId(findingId) ?? scenario).primaryFindingTitle;
  }

  if (isPhiMinimizationFindingId(findingId)) {
    return residualMinimizationRiskHeading(resolveFindingSampleScenario(payload, findingId));
  }

  if (payload !== null) {
    return findingDetailHeadingTitle(payload);
  }

  return BUYER_SURFACE_VOCABULARY.finding;
}

/** Short user-facing primer under the title when structured description is unavailable. */
export function findingDetailLeadSentence(payload: FindingInspectPayload): string {
  if (isPhiMinimizationSampleFinding(payload) && isBuyerPolishedOperatorShellEnv()) {
    return BUYER_FINDING_POST_APPROVAL_LEAD;
  }

  const narrative = findingInspectNarrativeFields(payload);
  const description = narrative.description?.trim();

  if (description !== undefined && description.length > 0) {
    return description;
  }

  const labels = findingInspectPrimaryLabels(payload);
  const area = labels.impactedAreaLabel?.trim();

  if (area !== undefined && area.length > 0) {
    if (isBuyerPolishedOperatorShellEnv()) {
      return `Recorded risk observation for ${area}. Residual disposition and monitoring cadence are documented in the policy record.`;
    }

    return `Outcome focuses on ${area}. Review evidence and the recommended action before closing or escalating.`;
  }

  if (isBuyerPolishedOperatorShellEnv()) {
    return "Risk observation record for the finalized review — see evidence and monitoring details below.";
  }

  return "Review the recommendations and cited evidence below before sign-off.";
}

/** Optional narrative for "Why this matters" — common typed-payload keys from finding engines. */
export function findingWhyThisMattersText(payload: FindingInspectPayload): string | null {
  return (
    typedPayloadLookupString(payload, "whyThisMatters") ??
    typedPayloadLookupString(payload, "WhyThisMatters") ??
    typedPayloadLookupString(payload, "rationale") ??
    typedPayloadLookupString(payload, "Rationale") ??
    typedPayloadLookupString(payload, "businessImpact") ??
    typedPayloadLookupString(payload, "impact") ??
    null
  );
}

/** Curated demo / seeded spine — stable identity for PHI minimization risk screens. */
export function isPhiMinimizationSampleFinding(payload: FindingInspectPayload): boolean {
  if (isPhiMinimizationFindingId(payload.findingId)) {
    return true;
  }

  const cat =
    typedPayloadLookupString(payload, "category") ??
    typedPayloadLookupString(payload, "Category") ??
    "";

  return sampleCategoryTokenMatches(cat);
}

/**
 * Eyebrow label for finding **detail** — distinct from the parent review frame.
 */
export function findingDetailPageEyebrow(payload: FindingInspectPayload | null, findingId?: string): string {
  if (payload !== null ? isPhiMinimizationSampleFinding(payload) : isPhiMinimizationFindingId(findingId)) {
    return `Finding summary — ${sampleHeroFindingEyebrowSuffix(resolveFindingSampleScenario(payload, findingId))}`;
  }

  return "Finding summary";
}

/**
 * Eyebrow for **inspect / traceability** route — emphasizes evidence path, not the review summary.
 */
export function findingInspectPageEyebrow(payload: FindingInspectPayload): string {
  if (isPhiMinimizationSampleFinding(payload)) {
    return `Technical evidence trace — ${sampleHeroFindingEyebrowSuffix(resolveFindingSampleScenario(payload))}`;
  }

  return "Technical evidence trace";
}

/**
 * Consequence + control + monitoring framing for the PHI sample (when payload lacks richer narrative).
 */
export function phiMinimizationBuyerConsequenceNarrative(): string {
  return (
    "If understated, PHI could accumulate in adapters or caches beyond the intended minimization boundary — " +
    "expanding breach impact, audit scope, and downstream processing obligations. " +
    "The finalized review documents classification at ingress, adapter boundaries, and retention controls; " +
    "the evidence trail shows how those controls tie to this observation. " +
    `Monitoring owner ${BUYER_SHOWCASE_RESIDUAL_RISK_OWNER} tracks exception paths, attachment volume, and OCR bypass rates on a ${BUYER_SHOWCASE_RESIDUAL_RISK_MONITORING_CADENCE.toLowerCase()} cadence; next review ${resolveBuyerShowcaseResidualRiskNextReviewIso()}.`
  );
}

export function phiMinimizationApprovalNarrative(): string {
  if (isBuyerPolishedOperatorShellEnv()) {
    return BUYER_FINDING_POST_APPROVAL_VALIDATION;
  }

  return (
    "Before approval, reviewers need evidence that PHI classification occurs at ingress, adapter boundaries remain " +
    "stateless or explicitly bounded, unstructured attachments cannot bypass the OCR/control path unnoticed, and " +
    "post-go-live monitoring will surface exception volume before it becomes an audit or breach exposure."
  );
}

/** Specific recommended actions for the PHI showcase when structured actions are unavailable. */
export function phiMinimizationRecommendedActionFallback(): string {
  return (
    "Validate ingress PHI classification rules, monitor unstructured attachment exception volumes weekly, confirm OCR bypass " +
    "handling alerts fire before volume thresholds, and schedule a post-go-live review with the privacy office."
  );
}

export function phiMinimizationControlNarrative(): string {
  return (
    "Controls should include ingress classification, bounded adapter persistence, retention alignment, signed event " +
    "lineage, exception monitoring, and review of OCR bypass paths during rollout."
  );
}
