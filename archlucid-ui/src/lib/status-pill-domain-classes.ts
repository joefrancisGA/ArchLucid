import { cn } from "@/lib/utils";

export type StatusPillDomain = "pipeline" | "governance" | "health" | "general";

import { METADATA_STATUS_TAG_SHELL } from "@/lib/design-tokens";

/** Shared shell for {@link import("@/components/StatusPill")} — metadata label, not a control. */
export const STATUS_PILL_BASE = METADATA_STATUS_TAG_SHELL;

function pipelineSemanticClass(status: string): string {
  switch (status) {
    case "Finalized":
    case "Package finalized":
    case "Ready":
      return "bg-[var(--al-status-ready-bg)] text-[var(--al-status-ready-fg)]";

    case "Ready to finalize":
    case "Needs attention":
      return "bg-[var(--al-status-warn-bg)] text-[var(--al-status-warn-fg)]";

    case "In pipeline":
    case "In flight":
    case "In review":
    case "In progress":
      return "bg-blue-500/10 text-blue-900 dark:bg-blue-500/15 dark:text-blue-200";

    case "Starting":
      return "bg-[var(--al-status-neutral-bg)] text-[var(--al-status-neutral-fg)]";

    default:
      return generalSemanticClass(status);
  }
}

/** Same palette as legacy `governance-status-badge-class.ts` (kept for deprecation re-export). */
export function governanceDomainBadgeClass(status: string): string {
  switch (status) {
    case "Approved with monitoring":
      return "bg-[var(--al-status-approved-monitoring-bg)] text-[var(--al-status-approved-monitoring-fg)]";

    case "Submitted":
      return "bg-blue-500/10 text-blue-900 dark:bg-blue-500/15 dark:text-blue-200";

    case "Approved":
      return "bg-[var(--al-status-approved-bg)] text-[var(--al-status-approved-fg)]";

    case "Failed":
    case "Rejected":
      return "bg-[var(--al-status-blocked-bg)] text-[var(--al-status-blocked-fg)]";

    case "Promoted":
      return "bg-violet-500/12 text-violet-950 dark:bg-violet-500/18 dark:text-violet-100";

    case "Activated":
      return "bg-teal-500/12 text-teal-950 dark:bg-teal-500/18 dark:text-teal-100";

    case "Draft":
    default:
      return "bg-[var(--al-status-neutral-bg)] text-[var(--al-status-neutral-fg)]";
  }
}

function healthSemanticClass(status: string): string {
  const s = status.trim().toLowerCase();

  if (s === "healthy" || s === "closed" || s === "ok") {
    return "bg-[var(--al-status-ready-bg)] text-[var(--al-status-ready-fg)]";
  }

  if (s === "degraded" || s === "halfopen") {
    return "bg-orange-500/12 text-orange-950 dark:bg-orange-500/18 dark:text-orange-100";
  }

  if (s === "demo limited" || s === "sample scope" || s === "action needed") {
    return "bg-[var(--al-status-warn-bg)] text-[var(--al-status-warn-fg)]";
  }

  if (
    s === "skipped"
    || s === "not configured"
    || s === "not applicable"
    || s === "n/a"
    || s === "unknown"
  ) {
    return "bg-[var(--al-status-neutral-bg)] text-[var(--al-status-neutral-fg)]";
  }

  if (s === "advisory" || s === "warn" || s === "warning") {
    return "bg-[var(--al-status-warn-bg)] text-[var(--al-status-warn-fg)]";
  }

  if (s === "unhealthy" || s === "open" || s === "failing" || s === "fail" || s === "failed") {
    return "bg-[var(--al-status-blocked-bg)] text-[var(--al-status-blocked-fg)]";
  }

  return generalSemanticClass(status);
}

function generalSemanticClass(status: string): string {
  if (status.trim().length === 0) {
    return "bg-[var(--al-status-neutral-bg)] text-[var(--al-status-neutral-fg)]";
  }

  return "bg-[var(--al-status-neutral-bg)] text-[var(--al-status-neutral-fg)]";
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
