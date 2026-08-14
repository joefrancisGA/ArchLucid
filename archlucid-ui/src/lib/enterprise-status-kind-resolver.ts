import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import {
  PIPELINE_STATUS_BUYER_DISPLAY_LABELS,
  PIPELINE_STATUS_LABELS,
} from "@/lib/pipeline-status-labels";

/** Domain hint when the same display string means different posture in another surface. */
export type EnterpriseStatusDomainHint = "pipeline" | "governance" | "health" | "general" | "budget";

function normalizeStatusKey(display: string): string {
  return display.trim().toLowerCase();
}

function resolvePipelineStatusKind(display: string): EnterpriseStatusKind | null {
  const key = normalizeStatusKey(display);

  switch (key) {
    case normalizeStatusKey(PIPELINE_STATUS_LABELS.finalized):
    case normalizeStatusKey(PIPELINE_STATUS_BUYER_DISPLAY_LABELS.finalized):
    case "package finalized":
    case "ready":
      return "ready";

    case normalizeStatusKey(PIPELINE_STATUS_LABELS.readyToFinalize):
    case normalizeStatusKey(PIPELINE_STATUS_BUYER_DISPLAY_LABELS.readyToFinalize):
    case "needs attention":
      return "needs-attention";

    case normalizeStatusKey(PIPELINE_STATUS_LABELS.inPipeline):
    case normalizeStatusKey(PIPELINE_STATUS_BUYER_DISPLAY_LABELS.inPipeline):
    case "in flight":
    case "in review":
    case "in progress":
      return "in-progress";

    case normalizeStatusKey(PIPELINE_STATUS_LABELS.starting):
    case normalizeStatusKey(PIPELINE_STATUS_BUYER_DISPLAY_LABELS.starting):
      return "neutral";

    default:
      return null;
  }
}

function resolveGovernanceStatusKind(display: string): EnterpriseStatusKind | null {
  const key = normalizeStatusKey(display);

  switch (key) {
    case "approved with monitoring":
      return "approved-with-monitoring";

    case "submitted":
    case "pending":
    case "pending architecture review":
    case "in review":
    case "inreview":
      return "in-progress";

    case "approved":
    case "passed":
      return "approved";

    case "failed":
    case "rejected":
    case "denied":
      return "blocked";

    case "promoted":
      return "approved";

    case "activated":
      return "ready";

    case "draft":
      return "draft";

    case "withdrawn":
    case "not required":
    case "no governance decision recorded":
      return "neutral";

    default:
      return null;
  }
}

function resolveHealthStatusKind(display: string): EnterpriseStatusKind | null {
  const key = normalizeStatusKey(display);

  if (key === "healthy" || key === "closed" || key === "ok") {
    return "ready";
  }

  if (key === "degraded" || key === "halfopen") {
    return "needs-attention";
  }

  if (key === "demo limited" || key === "sample scope" || key === "action needed") {
    return "needs-attention";
  }

  if (
    key === "skipped"
    || key === "not configured"
    || key === "not applicable"
    || key === "n/a"
    || key === "unknown"
  ) {
    return "neutral";
  }

  if (key === "advisory" || key === "warn" || key === "warning") {
    return "needs-attention";
  }

  if (key === "unhealthy" || key === "open" || key === "failing" || key === "fail" || key === "failed") {
    return "blocked";
  }

  return null;
}

function resolveBudgetStatusKind(display: string): EnterpriseStatusKind | null {
  const key = normalizeStatusKey(display);

  if (key.includes("hard stop") || key.includes("exhausted") || key.includes("paused") || key.includes("0%")) {
    return "blocked";
  }

  if (key === "configured") {
    return "ready";
  }

  if (key === "not configured") {
    return "needs-attention";
  }

  if (key.includes("budget") && (key.includes("warn") || key.includes("low") || key.includes("%"))) {
    return "needs-attention";
  }

  return null;
}

/**
 * Canonical display-string → {@link EnterpriseStatusKind} resolver (**TB-2285**).
 * Shared by `StatusTag`, legacy `StatusPill`, and pipeline presentation helpers.
 */
export function resolveEnterpriseStatusKind(
  display: string,
  domain: EnterpriseStatusDomainHint = "general",
): EnterpriseStatusKind {
  if (display.trim().length === 0) {
    return "neutral";
  }

  const domainResolved = resolveByDomain(display, domain);

  if (domainResolved !== null) {
    return domainResolved;
  }

  const pipelineResolved = resolvePipelineStatusKind(display);

  if (pipelineResolved !== null) {
    return pipelineResolved;
  }

  const governanceResolved = resolveGovernanceStatusKind(display);

  if (governanceResolved !== null) {
    return governanceResolved;
  }

  const healthResolved = resolveHealthStatusKind(display);

  if (healthResolved !== null) {
    return healthResolved;
  }

  const budgetResolved = resolveBudgetStatusKind(display);

  if (budgetResolved !== null) {
    return budgetResolved;
  }

  return "neutral";
}

function resolveByDomain(
  display: string,
  domain: EnterpriseStatusDomainHint,
): EnterpriseStatusKind | null {
  switch (domain) {
    case "pipeline":
      return resolvePipelineStatusKind(display);

    case "governance":
      return resolveGovernanceStatusKind(display);

    case "health":
      return resolveHealthStatusKind(display);

    case "budget":
      return resolveBudgetStatusKind(display);

    case "general":
    default:
      return null;
  }
}
