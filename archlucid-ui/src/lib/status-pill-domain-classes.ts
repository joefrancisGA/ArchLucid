import { cn } from "@/lib/utils";

export type StatusPillDomain = "pipeline" | "governance" | "health" | "general";

import { METADATA_STATUS_TAG_SHELL } from "@/lib/design-tokens";

/** Shared shell for {@link import("@/components/StatusPill")} — metadata label, not a control. */
export const STATUS_PILL_BASE = METADATA_STATUS_TAG_SHELL;

function pipelineSemanticClass(status: string): string {
  switch (status) {
    case "Finalized":
    case "Package finalized":
      return "border-emerald-800/50 bg-[var(--al-status-ready-bg)] text-[var(--al-status-ready-fg)]";

    case "Ready to finalize":
    case "Ready to seal":
      return "border-amber-700/50 bg-[var(--al-status-warn-bg)] text-[var(--al-status-warn-fg)]";

    case "In pipeline":
    case "In flight":
    case "In review":
      return "border-blue-700/40 bg-al-surface-raised text-al-text-primary dark:border-blue-600/50";

    case "Starting":
      return "border-neutral-300 bg-al-surface-raised text-al-text-secondary dark:border-neutral-600";

    default:
      return generalSemanticClass(status);
  }
}

/** Same palette as legacy `governance-status-badge-class.ts` (kept for deprecation re-export). */
export function governanceDomainBadgeClass(status: string): string {
  switch (status) {
    case "Approved with monitoring":
      return "border-teal-800/40 bg-[var(--al-status-approved-monitoring-bg)] text-[var(--al-status-approved-monitoring-fg)]";

    case "Submitted":
      return "border-blue-700/40 bg-al-surface-raised text-al-text-primary dark:border-blue-600/50";

    case "Approved":
      return "border-emerald-800/50 bg-[var(--al-status-approved-bg)] text-[var(--al-status-approved-fg)]";

    case "Failed":
    case "Rejected":
      return "border-rose-700/50 bg-[var(--al-status-blocked-bg)] text-[var(--al-status-blocked-fg)]";

    case "Promoted":
      return "border-violet-700/40 bg-violet-50/80 text-violet-950 dark:border-violet-600/40 dark:bg-violet-950/30 dark:text-violet-100";

    case "Activated":
      return "border-teal-700/40 bg-teal-50/80 text-teal-950 dark:border-teal-600/40 dark:bg-teal-950/30 dark:text-teal-100";

    case "Draft":
    default:
      return "border-neutral-300 bg-al-surface-raised text-al-text-secondary dark:border-neutral-600";
  }
}

function healthSemanticClass(status: string): string {
  const s = status.trim().toLowerCase();

  if (s === "healthy" || s === "closed") {
    return "border-emerald-700/40 bg-al-surface-raised text-al-text-primary dark:border-emerald-800/50";
  }

  if (s === "degraded" || s === "halfopen") {
    return "border-amber-600/40 bg-al-surface-raised text-al-text-primary dark:border-amber-700/50";
  }

  if (s === "unhealthy" || s === "open") {
    return "border-rose-600/40 bg-al-surface-raised text-al-text-primary dark:border-rose-800/50";
  }

  return generalSemanticClass(status);
}

function generalSemanticClass(status: string): string {
  if (status.trim().length === 0) {
    return "border-neutral-300 bg-neutral-50 text-neutral-700 dark:border-neutral-600 dark:bg-neutral-900/50 dark:text-neutral-200";
  }

  return "border-neutral-300 bg-neutral-50 text-neutral-800 dark:border-neutral-600 dark:bg-neutral-900/60 dark:text-neutral-200";
}

/**
 * Tailwind classes for {@link import("@/components/StatusPill")} semantic fills.
 */
export function statusPillDomainClass(status: string, domain: StatusPillDomain): string {
  switch (domain) {
    case "pipeline":
      return pipelineSemanticClass(status);

    case "governance":
      return governanceDomainBadgeClass(status);

    case "health":
      return healthSemanticClass(status);

    case "general":
    default:
      return generalSemanticClass(status);
  }
}

export function statusPillCombinedClass(status: string, domain: StatusPillDomain): string {
  return cn(STATUS_PILL_BASE, statusPillDomainClass(status, domain));
}
