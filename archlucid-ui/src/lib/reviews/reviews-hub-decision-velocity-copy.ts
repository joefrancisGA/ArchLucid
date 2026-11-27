import { buyerDemoPackageCardMeta } from "@/lib/buyer/buyer-demo-package-card-meta";
import { parseIsoUtcMs } from "@/lib/format-iso-utc";
import type { RunSummary } from "@/types/authority";
import {
  reviewsHubLifecycleStage,
  reviewsHubOverallStatus,
} from "@/app/(operator)/architecture/reviews/_sections/reviews-hub-review-status";
export type ReviewsHubDecisionSlaBadge = "Finalize soon" | "Decision due" | "Past due" | "On track";
export type ReviewsHubWaitingOnKind = "you" | "them" | "system";
export const REVIEWS_HUB_DECISION_SLA_DAYS = 14 as const;
export const REVIEWS_HUB_WAITING_ON_YOU_LABEL = "Waiting on you" as const;
export const REVIEWS_HUB_WAITING_ON_THEM_LABEL = "Waiting on them" as const;
export const REVIEWS_HUB_WAITING_ON_SYSTEM_LABEL = "Waiting on system" as const;
export function resolveReviewsHubDecisionSlaBadge(run: RunSummary, nowMs: number = Date.now()): ReviewsHubDecisionSlaBadge | null {
  if (run.isArchived === true) return null;
  const overall = reviewsHubOverallStatus(run);
  if (overall === "Finalized" || overall === "Archived") return run.hasGovernanceWarnings === true ? "On track" : null;
  const demoMeta = buyerDemoPackageCardMeta(run.runId);
  if (demoMeta !== null) {
    const summary = demoMeta.decisionSummary.toLowerCase();
    if (summary.includes("approval in progress") || summary.includes("awaiting")) return "Decision due";
    if (summary.includes("in progress") && run.hasGoldenManifest !== true) return "Finalize soon";
  }
  const createdMs = parseIsoUtcMs(run.createdUtc?.trim() ?? "");
  if (!Number.isFinite(createdMs) || createdMs <= 0) return null;
  const ageDays = (nowMs - createdMs) / (24 * 60 * 60 * 1000);
  const lifecycle = reviewsHubLifecycleStage(run);
  if (run.hasGoldenManifest !== true && (lifecycle === "Evaluation" || run.hasFindingsSnapshot === true)) {
    if (ageDays >= REVIEWS_HUB_DECISION_SLA_DAYS) return "Past due";
    if (ageDays >= REVIEWS_HUB_DECISION_SLA_DAYS - 3) return "Finalize soon";
  }
  return null;
}
export function reviewsHubDecisionSlaBadgeClassName(badge: ReviewsHubDecisionSlaBadge): string {
  switch (badge) {
    case "Past due": return "border-destructive/40 text-destructive";
    case "Decision due":
    case "Finalize soon": return "border-amber-500/40 text-amber-800 dark:text-amber-200";
    case "On track": return "border-border text-al-text-secondary";
    default: { const _exhaustive: never = badge; return _exhaustive; }
  }
}
export function resolveReviewsHubWaitingOnKind(run: RunSummary): ReviewsHubWaitingOnKind | null {
  if (run.isArchived === true) return null;
  if (run.hasGoldenManifest === true) {
    const decision = run.operatorGovernanceDecision?.trim() ?? "";
    if (decision.length > 0) return null;
    const demoMeta = buyerDemoPackageCardMeta(run.runId);
    if (demoMeta !== null && demoMeta.decisionSummary.toLowerCase().includes("approval")) return "them";
    return run.hasGovernanceWarnings === true ? "you" : null;
  }
  const hasPipelineStarted = run.hasContextSnapshot === true || run.hasGraphSnapshot === true || run.hasFindingsSnapshot === true;
  if (!hasPipelineStarted || run.hasFindingsSnapshot !== true) return "system";
  const demoMeta = buyerDemoPackageCardMeta(run.runId);
  if (demoMeta !== null && demoMeta.decisionSummary.toLowerCase().includes("approval in progress")) return "them";
  return "you";
}
export function resolveReviewsHubWaitingOnLabel(kind: ReviewsHubWaitingOnKind): string {
  switch (kind) {
    case "you": return REVIEWS_HUB_WAITING_ON_YOU_LABEL;
    case "them": return REVIEWS_HUB_WAITING_ON_THEM_LABEL;
    case "system": return REVIEWS_HUB_WAITING_ON_SYSTEM_LABEL;
    default: { const _exhaustive: never = kind; return _exhaustive; }
  }
}
