import { cn } from "@/lib/utils";

export type StatusPillDomain = "pipeline" | "governance" | "health" | "general";

/** Shared shell: pill shape, compact type (add `uppercase` in {@link import("@/components/StatusPill")} by default). */
export const STATUS_PILL_BASE = "rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide";

function pipelineSemanticClass(status: string): string {
  switch (status) {
    case "Finalized":
      return "border border-emerald-950/30 bg-emerald-900 text-white shadow-sm ring-1 ring-emerald-950/35 hover:bg-emerald-900/95 dark:border-emerald-700/80 dark:bg-emerald-950 dark:text-emerald-50 dark:ring-emerald-400/25 dark:hover:bg-emerald-950/90";
    case "Ready to finalize":
      return "border-amber-500/70 bg-amber-50 text-amber-950 shadow-sm dark:border-amber-600/60 dark:bg-amber-950/50 dark:text-amber-50";
    case "In pipeline":
      return "border-blue-500/70 bg-blue-50 text-blue-950 dark:border-blue-600/60 dark:bg-blue-950/40 dark:text-blue-100";
    case "Starting":
      return "border-neutral-300 bg-neutral-50 text-neutral-800 dark:border-neutral-600 dark:bg-neutral-900/60 dark:text-neutral-200";
    default:
      return generalSemanticClass(status);
  }
}

/** Same palette as legacy `governance-status-badge-class.ts` (kept for deprecation re-export). */
export function governanceDomainBadgeClass(status: string): string {
  switch (status) {
    case "Approved with monitoring":
      return "border border-teal-950/25 bg-teal-900 text-white shadow-sm ring-1 ring-teal-950/35 hover:bg-teal-900/95 dark:border-teal-600/70 dark:bg-teal-950 dark:text-teal-50 dark:ring-teal-300/30 dark:hover:bg-teal-950/90";
    case "Submitted":
      return "border-transparent bg-blue-600 text-white hover:bg-blue-600/90 dark:bg-blue-600 dark:hover:bg-blue-600/90";
    case "Approved":
      return "border-transparent bg-emerald-800 text-white hover:bg-emerald-800/90 dark:bg-emerald-800 dark:hover:bg-emerald-800/90";
    case "Failed":
      return "border-transparent bg-red-600 text-white hover:bg-red-600/90 dark:bg-red-600 dark:hover:bg-red-600/90";
    case "Rejected":
      return "border-transparent bg-red-600 text-white hover:bg-red-600/90 dark:bg-red-600 dark:hover:bg-red-600/90";
    case "Promoted":
      return "border-transparent bg-violet-600 text-white hover:bg-violet-600/90 dark:bg-violet-600 dark:hover:bg-violet-600/90";
    case "Activated":
      return "border-transparent bg-teal-700 text-white hover:bg-teal-700/90 dark:bg-teal-700 dark:hover:bg-teal-700/90";
    case "Draft":
    default:
      return "border-neutral-200 bg-neutral-100 text-neutral-900 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100";
  }
}

function healthSemanticClass(status: string): string {
  const s = status.trim().toLowerCase();

  if (s === "healthy" || s === "closed") {
    return "border-emerald-300 bg-emerald-100 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-100";
  }

  if (s === "degraded" || s === "halfopen") {
    return "border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-100";
  }

  if (s === "unhealthy" || s === "open") {
    return "border-rose-300 bg-rose-100 text-rose-950 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-100";
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
 * Tailwind classes for {@link import("@/components/StatusPill")} (Badge outline + semantic fills).
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
