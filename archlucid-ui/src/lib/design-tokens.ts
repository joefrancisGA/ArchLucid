/**
 * Wave 0 enterprise design tokens — centralized palette for operator surfaces.
 * See `docs/library/UI_DESIGN_SYSTEM.md` (Carbon-inspired, restrained teal accent).
 */
export const DESIGN_TOKENS = {
  surface: {
    page: "bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100",
    card: "border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950",
    muted: "bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300",
  },
  accent: {
    teal: "text-teal-800 dark:text-teal-300",
    tealBorder: "border-teal-200/80 dark:border-teal-900/50",
  },
  typography: {
    pageTitle: "text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100",
    sectionTitle: "text-lg font-semibold text-neutral-900 dark:text-neutral-100",
    body: "text-sm leading-relaxed text-neutral-800 dark:text-neutral-200",
    meta: "text-sm text-neutral-600 dark:text-neutral-400",
  },
  statusTag: {
    ready:
      "border border-emerald-950/30 bg-emerald-900 text-white shadow-sm ring-1 ring-emerald-950/35 dark:border-emerald-700/80 dark:bg-emerald-950 dark:text-emerald-50",
    needsAttention:
      "border-amber-500/70 bg-amber-50 text-amber-950 shadow-sm dark:border-amber-600/60 dark:bg-amber-950/50 dark:text-amber-50",
    blocked:
      "border-rose-500/70 bg-rose-50 text-rose-950 shadow-sm dark:border-rose-700/60 dark:bg-rose-950/50 dark:text-rose-50",
    approved:
      "border-transparent bg-emerald-800 text-white dark:bg-emerald-800 dark:text-white",
    approvedWithMonitoring:
      "border border-teal-950/25 bg-teal-900 text-white shadow-sm ring-1 ring-teal-950/35 dark:border-teal-600/70 dark:bg-teal-950 dark:text-teal-50",
    neutral:
      "border-neutral-300 bg-neutral-50 text-neutral-800 dark:border-neutral-600 dark:bg-neutral-900/60 dark:text-neutral-200",
  },
  table: {
    shell: "w-full border-collapse border border-neutral-200 text-sm dark:border-neutral-800",
    head: "bg-neutral-100 dark:bg-neutral-900",
    cell: "border border-neutral-200 px-3 py-2 dark:border-neutral-800",
  },
} as const;

export type EnterpriseStatusKind =
  | "ready"
  | "needs-attention"
  | "blocked"
  | "approved"
  | "approved-with-monitoring"
  | "neutral";

export const ENTERPRISE_STATUS_LABELS: Readonly<Record<EnterpriseStatusKind, string>> = {
  ready: "Ready",
  "needs-attention": "Needs attention",
  blocked: "Blocked",
  approved: "Approved",
  "approved-with-monitoring": "Approved with monitoring",
  neutral: "—",
};

export function enterpriseStatusTagClass(kind: EnterpriseStatusKind): string {
  switch (kind) {
    case "ready":
      return DESIGN_TOKENS.statusTag.ready;

    case "needs-attention":
      return DESIGN_TOKENS.statusTag.needsAttention;

    case "blocked":
      return DESIGN_TOKENS.statusTag.blocked;

    case "approved":
      return DESIGN_TOKENS.statusTag.approved;

    case "approved-with-monitoring":
      return DESIGN_TOKENS.statusTag.approvedWithMonitoring;

    case "neutral":
    default:
      return DESIGN_TOKENS.statusTag.neutral;
  }
}
