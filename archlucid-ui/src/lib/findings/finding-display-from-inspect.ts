import {
  BUYER_FINDING_POST_APPROVAL_LEAD,
  BUYER_FINDING_POST_APPROVAL_VALIDATION,
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
      typedPayloadLookupString(payload, "recommendation") ??
      typedPayloadLookupString(payload, "Recommendation") ??
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
      typedPayloadLookupString(payload, "title") ?? typedPayloadLookupString(payload, "Title") ?? null,
    description:
      typedPayloadLookupString(payload, "description") ??
      typedPayloadLookupString(payload, "Description") ??
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
  const narrative = findingInspectNarrativeFields(payload);
  const titleCandidate = narrative.title?.trim();

  if (titleCandidate !== undefined && titleCandidate.length > 0) {
    return titleCandidate;
  }

  const scenario =
    resolveSampleScenarioByHeroFindingId(payload.findingId) ?? resolveSampleScenarioByRunId(payload.runId);

  if (isShowcasePrimaryPhiFindingId(payload.findingId) && scenario !== null) {
    return scenario.primaryFindingTitle;
  }

  return "Finding title was not stored";
}

/** Route-aware title fallback used before / when the inspect payload is sparse. */
export function findingDetailHeadingTitleForRoute(
  findingId: string,
  payload: FindingInspectPayload | null
): string {
  if (payload !== null) {
    const narrative = findingInspectNarrativeFields(payload);
    const titleCandidate = narrative.title?.trim();

    if (titleCandidate !== undefined && titleCandidate.length > 0) {
      return titleCandidate;
    }
  }

  const scenario =
    resolveSampleScenarioByHeroFindingId(findingId) ??
    (payload !== null ? resolveSampleScenarioByRunId(payload.runId) : null);

  if (isShowcasePrimaryPhiFindingId(findingId) && scenario !== null) {
    return scenario.primaryFindingTitle;
  }

  if (payload !== null) {
    return findingDetailHeadingTitle(payload);
  }

  return "Finding title was not stored";
}

/** Short user-facing primer under the title when structured description is unavailable. */
export function findingDetailLeadSentence(payload: FindingInspectPayload): string {
  const narrative = findingInspectNarrativeFields(payload);
  const description = narrative.description?.trim();

  if (description !== undefined && description.length > 0) {
    return description;
  }

  if (isPhiMinimizationSampleFinding(payload) && isBuyerPolishedOperatorShellEnv()) {
    return BUYER_FINDING_POST_APPROVAL_LEAD;
  }

  return "Finding description was not stored.";
}

/** Optional narrative for "Why this matters" — common typed-payload keys from finding engines. */
export function findingWhyThisMattersText(payload: FindingInspectPayload): string | null {
  return (
    typedPayloadLookupString(payload, "whyThisMatters") ??
    typedPayloadLookupString(payload, "WhyThisMatters") ??
    null
  );
}

/** Separate disposition rationale — not shown under the why-this-matters heading. */
export function findingInspectTypedRationaleText(payload: FindingInspectPayload): string | null {
  return (
    typedPayloadLookupString(payload, "rationale") ??
    typedPayloadLookupString(payload, "Rationale") ??
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
  const scenario = resolveFindingSampleScenario(payload, findingId);
  const resolvedFindingId = findingId ?? payload?.findingId ?? null;

  if (isShowcasePrimaryPhiFindingId(resolvedFindingId) && scenario !== null) {
    return `Finding summary — ${sampleHeroFindingEyebrowSuffix(scenario)}`;
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
  return "Sample finding. A stored consequence was not stored.";
}

export function phiMinimizationApprovalNarrative(): string {
  if (isBuyerPolishedOperatorShellEnv()) {
    return BUYER_FINDING_POST_APPROVAL_VALIDATION;
  }

  return "A stored acceptance was not stored on this finding.";
}

/** Specific recommended actions for the PHI showcase when structured actions are unavailable. */
export function phiMinimizationRecommendedActionFallback(): string {
  return "Recommended action was not stored.";
}

export function phiMinimizationControlNarrative(): string {
  return (
    "Controls should include ingress classification, bounded adapter persistence, retention alignment, signed event " +
    "lineage, exception monitoring, and review of OCR bypass paths during rollout."
  );
}
