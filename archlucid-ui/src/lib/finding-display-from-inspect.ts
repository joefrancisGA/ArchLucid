import { SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID } from "@/lib/showcase-static-demo";
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
      (payload.recommendedActions?.filter((a) => a.trim().length > 0)[0] ?? null) ??
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
  const normalized = findingId?.trim().toLowerCase() ?? "";

  return normalized === SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID.toLowerCase() || normalized.includes("phi");
}

/**
 * Preferred page title for Finding detail — human narrative first, then rule context, generic last.
 */
export function findingDetailHeadingTitle(payload: FindingInspectPayload): string {
  if (isPhiMinimizationSampleFinding(payload)) {
    return "PHI Minimization Risk";
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
  if (isPhiMinimizationFindingId(findingId)) {
    return "PHI Minimization Risk";
  }

  if (payload !== null) {
    return findingDetailHeadingTitle(payload);
  }

  return "Finding detail";
}

/** Short user-facing primer under the title when structured description is unavailable. */
export function findingDetailLeadSentence(payload: FindingInspectPayload): string {
  const narrative = findingInspectNarrativeFields(payload);
  const description = narrative.description?.trim();

  if (description !== undefined && description.length > 0) {
    return description;
  }

  const labels = findingInspectPrimaryLabels(payload);
  const area = labels.impactedAreaLabel?.trim();

  if (area !== undefined && area.length > 0) {
    return `Outcome focuses on ${area}. Review evidence and the recommended action before closing or escalating.`;
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

  return cat.toLowerCase().includes("phi");
}

/**
 * Eyebrow label for finding **detail** — distinct from the parent review package frame.
 */
export function findingDetailPageEyebrow(payload: FindingInspectPayload | null, findingId?: string): string {
  if (payload !== null ? isPhiMinimizationSampleFinding(payload) : isPhiMinimizationFindingId(findingId)) {
    return "Finding detail — PHI minimization";
  }

  return "Finding detail — risk observation";
}

/**
 * Eyebrow for **inspect / traceability** route — emphasizes evidence path, not the review summary.
 */
export function findingInspectPageEyebrow(payload: FindingInspectPayload): string {
  if (isPhiMinimizationSampleFinding(payload)) {
    return "Traceability — PHI minimization risk";
  }

  return "Traceability inspection";
}

/**
 * Consequence + control + monitoring framing for the PHI sample (when payload lacks richer narrative).
 */
export function phiMinimizationBuyerConsequenceNarrative(): string {
  return (
    "If understated, PHI could accumulate in adapters or caches beyond the intended minimization boundary — " +
    "expanding breach impact, audit scope, and downstream processing obligations. " +
    "The review package documents classification at ingress, adapter boundaries, and retention controls; " +
    "evidence snapshots and the evidence graph show how those controls tie to this observation. " +
    "Ongoing monitoring should track exception paths, attachment volume, and OCR bypass rates after go-live."
  );
}

export function phiMinimizationApprovalNarrative(): string {
  return (
    "Before approval, reviewers need evidence that PHI classification occurs at ingress, adapter boundaries remain " +
    "stateless or explicitly bounded, unstructured attachments cannot bypass the OCR/control path unnoticed, and " +
    "post-go-live monitoring will surface exception volume before it becomes an audit or breach exposure."
  );
}

export function phiMinimizationControlNarrative(): string {
  return (
    "Controls should include ingress classification, bounded adapter persistence, retention alignment, signed event " +
    "lineage, exception monitoring, and review of OCR bypass paths during rollout."
  );
}
