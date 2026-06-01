/**
 * Enterprise design tokens (Carbon-inspired). Single source for operator-surface styling.
 * @see docs/library/UI_DESIGN_SYSTEM.md
 */

/** CSS custom properties wired in `src/app/globals.css` and Tailwind `theme.extend.colors.al`. */
export const AL_CSS_VAR_NAMES = {
  surfaceBase: "--al-surface-base",
  surfaceRaised: "--al-surface-raised",
  surfaceOverlay: "--al-surface-overlay",
  accentInteractive: "--al-accent-interactive",
  accentBorderFocus: "--al-accent-border-focus",
  textPrimary: "--al-text-primary",
  textSecondary: "--al-text-secondary",
  textPlaceholder: "--al-text-placeholder",
  textDisabled: "--al-text-disabled",
  statusReadyBg: "--al-status-ready-bg",
  statusReadyFg: "--al-status-ready-fg",
  statusWarnBg: "--al-status-warn-bg",
  statusWarnFg: "--al-status-warn-fg",
  statusBlockedBg: "--al-status-blocked-bg",
  statusBlockedFg: "--al-status-blocked-fg",
  statusApprovedBg: "--al-status-approved-bg",
  statusApprovedFg: "--al-status-approved-fg",
  statusApprovedMonitoringBg: "--al-status-approved-monitoring-bg",
  statusApprovedMonitoringFg: "--al-status-approved-monitoring-fg",
  layerHover: "--al-layer-hover",
} as const;

/** Tailwind class bundles for layout and surfaces (operator shell). */
export const OPERATOR_LAYOUT = {
  page: "bg-al-surface-base text-al-text-primary",
  sectionStack: "space-y-4",
  cardPadding: "p-4",
  inlineGap: "gap-2",
  sectionHeadingMargin: "mb-3",
} as const;

export const OPERATOR_TYPOGRAPHY = {
  pageTitle: "text-xl font-semibold tracking-tight text-al-text-primary",
  sectionTitle:
    "text-xs font-semibold uppercase tracking-wide text-al-text-secondary",
  /** In-card or inline subsection headings (not uppercase section labels). */
  cardTitle: "text-sm font-semibold text-al-text-primary",
  body: "text-sm leading-relaxed text-al-text-primary",
  meta: "text-sm text-al-text-secondary",
  label: "text-xs text-al-text-secondary",
  /** Status chips and compact metadata badges (11–12px). Do not use arbitrary `text-[10px]` on operator surfaces. */
  badge: "text-[11px] font-semibold leading-tight",
  dataValue: "text-sm font-medium tabular-nums text-al-text-primary",
  /** Dashboard / metric tiles only — not page titles. */
  kpiValue: "font-mono text-4xl font-semibold tabular-nums text-al-text-primary",
} as const;

export const DESIGN_TOKENS = {
  typography: OPERATOR_TYPOGRAPHY,
  surface: {
    page: OPERATOR_LAYOUT.page,
    card: "rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800",
    muted: "rounded-md border border-neutral-200 bg-neutral-100/80 dark:border-neutral-800 dark:bg-neutral-900/50",
  },
  accent: {
    link: "font-medium text-teal-800 underline dark:text-teal-300",
    focusRing:
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)]",
  },
  callout: {
    success:
      "rounded-md border border-emerald-700/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-emerald-800/50",
    warn: "rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50",
    blocked:
      "rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-rose-700/50",
    info: "rounded-md border border-neutral-300 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-neutral-700",
    neutral:
      "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 text-sm text-al-text-secondary dark:border-neutral-800",
  },
  banner: {
    page:
      "rounded-xl border border-neutral-200 border-l-4 border-l-[var(--al-accent-interactive)] bg-al-surface-raised px-5 py-4 shadow-sm dark:border-neutral-800",
    trial:
      "rounded-xl border border-neutral-200 border-l-4 border-l-amber-600 bg-al-surface-raised px-5 py-4 shadow-sm dark:border-neutral-800",
  },
  interactive: {
    rowHover:
      "transition-colors hover:border-neutral-300 hover:bg-[var(--al-layer-hover)] dark:hover:border-neutral-700 dark:hover:bg-neutral-800/80",
    chip:
      "inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2 py-0.5 text-xs font-medium text-al-text-primary no-underline hover:bg-[var(--al-layer-hover)] dark:border-neutral-600",
    asidePanel: "rounded-lg border border-neutral-200 bg-al-surface-raised p-4 shadow-sm dark:border-neutral-800",
    navActive:
      "border-l-2 border-l-[var(--al-accent-interactive)] bg-[var(--al-layer-hover)] font-semibold text-al-text-primary dark:bg-neutral-800/80",
  },
  table: {
    shell: "w-full overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800",
    table: "w-full border-collapse text-sm",
    headRow: "border-b border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900",
    headCell:
      "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-al-text-secondary",
    body: "divide-y divide-neutral-100 dark:divide-neutral-800",
    row: "outline-none transition-colors hover:bg-[var(--al-layer-hover)] dark:hover:bg-neutral-800/80",
    rowSelected:
      "border-l-2 border-l-[var(--al-accent-interactive)] bg-[var(--al-layer-hover)] dark:bg-neutral-800/80",
    cell: "px-3 py-2 align-top text-sm text-al-text-primary",
    cellSecondary: "text-xs text-al-text-secondary",
  },
} as const;

/** Shared class strings for bulk migration off pastel Tailwind fills (TB-115). */
export const OPERATOR_CALLOUT_WARN_CLASS = DESIGN_TOKENS.callout.warn;
export const OPERATOR_CALLOUT_BLOCKED_CLASS = DESIGN_TOKENS.callout.blocked;
export const OPERATOR_CALLOUT_SUCCESS_CLASS = DESIGN_TOKENS.callout.success;
export const OPERATOR_SURFACE_CARD_CLASS = DESIGN_TOKENS.surface.card;

export type EnterpriseStatusKind =
  | "ready"
  | "needs-attention"
  | "blocked"
  | "approved"
  | "approved-with-monitoring"
  | "in-progress"
  | "draft"
  | "neutral";

export const ENTERPRISE_STATUS_LABELS: Readonly<Record<EnterpriseStatusKind, string>> = {
  ready: "Ready",
  "needs-attention": "Needs attention",
  blocked: "Blocked",
  approved: "Approved",
  "approved-with-monitoring": "Approved with monitoring",
  "in-progress": "In progress",
  draft: "Draft",
  neutral: "—",
};

const STATUS_TAG_BASE =
  "inline-flex max-w-full items-center rounded-sm border px-2 py-0.5 text-xs font-medium leading-tight";

export function enterpriseStatusTagClass(kind: EnterpriseStatusKind): string {
  switch (kind) {
    case "ready":
      return `${STATUS_TAG_BASE} border-emerald-800/50 bg-[var(--al-status-ready-bg)] text-[var(--al-status-ready-fg)]`;

    case "needs-attention":
      return `${STATUS_TAG_BASE} border-amber-700/50 bg-[var(--al-status-warn-bg)] text-[var(--al-status-warn-fg)]`;

    case "blocked":
      return `${STATUS_TAG_BASE} border-rose-700/50 bg-[var(--al-status-blocked-bg)] text-[var(--al-status-blocked-fg)]`;

    case "approved":
      return `${STATUS_TAG_BASE} border-emerald-800/50 bg-[var(--al-status-approved-bg)] text-[var(--al-status-approved-fg)]`;

    case "approved-with-monitoring":
      return `${STATUS_TAG_BASE} border-teal-800/40 bg-[var(--al-status-approved-monitoring-bg)] text-[var(--al-status-approved-monitoring-fg)]`;

    case "in-progress":
      return `${STATUS_TAG_BASE} border-blue-700/40 bg-al-surface-raised text-al-text-primary dark:border-blue-600/50`;

    case "draft":
      return `${STATUS_TAG_BASE} border-neutral-400 bg-al-surface-raised text-al-text-secondary dark:border-neutral-600`;

    case "neutral":
    default:
      return `${STATUS_TAG_BASE} border-neutral-300 bg-al-surface-raised text-al-text-secondary dark:border-neutral-600`;
  }
}

export type FindingSeverityKind = "critical" | "high" | "medium" | "low" | "info" | "unknown";

export const SEVERITY_LABELS: Readonly<Record<FindingSeverityKind, string>> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
  unknown: "Unknown",
};

export function normalizeFindingSeverity(raw: string | null | undefined): FindingSeverityKind {
  const s = (raw ?? "").trim().toLowerCase();

  if (s.includes("critical")) {
    return "critical";
  }

  if (s.includes("high")) {
    return "high";
  }

  if (s.includes("medium") || s.includes("moderate")) {
    return "medium";
  }

  if (s.includes("low")) {
    return "low";
  }

  if (s.includes("info") || s.includes("informational")) {
    return "info";
  }

  return "unknown";
}

/** Actionable status / checklist surfaces (TB-115) — not decorative pastel fills. */
export type OperatorSemanticTone =
  | "ready"
  | "warn"
  | "blocked"
  | "info"
  | "neutral"
  | "current"
  | "upcoming"
  | "attention";

export function operatorSemanticSurface(tone: OperatorSemanticTone): string {
  switch (tone) {
    case "ready":
      return DESIGN_TOKENS.callout.success;

    case "warn":
    case "attention":
      return DESIGN_TOKENS.callout.warn;

    case "blocked":
      return DESIGN_TOKENS.callout.blocked;

    case "info":
      return DESIGN_TOKENS.callout.info;

    case "current":
      return "rounded-md border border-neutral-200 border-l-4 border-l-[var(--al-accent-interactive)] bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary shadow-sm dark:border-neutral-800";

    case "upcoming":
    case "neutral":
    default:
      return DESIGN_TOKENS.callout.neutral;
  }
}

/** Compact checklist / step badges (TB-115). */
export function operatorSemanticBadge(tone: OperatorSemanticTone): string {
  switch (tone) {
    case "ready":
      return enterpriseStatusTagClass("ready");

    case "warn":
    case "attention":
      return enterpriseStatusTagClass("needs-attention");

    case "blocked":
      return enterpriseStatusTagClass("blocked");

    case "info":
      return enterpriseStatusTagClass("in-progress");

    case "current":
      return `${STATUS_TAG_BASE} border-l-2 border-l-[var(--al-accent-interactive)] bg-al-surface-raised text-al-text-primary dark:border-neutral-700`;

    case "upcoming":
    case "neutral":
    default:
      return enterpriseStatusTagClass("neutral");
  }
}

export type OperatorConfidenceLevel = "high" | "medium" | "low";

export function operatorConfidenceSurface(level: OperatorConfidenceLevel): string {
  switch (level) {
    case "high":
      return operatorSemanticSurface("ready");

    case "medium":
      return operatorSemanticSurface("warn");

    case "low":
      return operatorSemanticSurface("blocked");

    default: {
      const exhaustive: never = level;

      return exhaustive;
    }
  }
}

export function severityTagClass(kind: FindingSeverityKind): string {
  switch (kind) {
    case "critical":
      return `${STATUS_TAG_BASE} border-rose-800/60 bg-[var(--al-status-blocked-bg)] text-[var(--al-status-blocked-fg)]`;

    case "high":
      return `${STATUS_TAG_BASE} border-amber-800/50 bg-[var(--al-status-warn-bg)] text-[var(--al-status-warn-fg)]`;

    case "medium":
      return `${STATUS_TAG_BASE} border-amber-600/40 bg-al-surface-raised text-al-text-primary`;

    case "low":
      return `${STATUS_TAG_BASE} border-neutral-400 bg-al-surface-raised text-al-text-secondary`;

    case "info":
      return `${STATUS_TAG_BASE} border-blue-700/40 bg-al-surface-raised text-al-text-primary`;

    case "unknown":
    default:
      return `${STATUS_TAG_BASE} border-neutral-300 bg-al-surface-raised text-al-text-secondary`;
  }
}
