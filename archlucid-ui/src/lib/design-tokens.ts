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
  primaryActionBg: "--al-primary-action-bg",
  primaryActionBgHover: "--al-primary-action-bg-hover",
  primaryActionFg: "--al-primary-action-fg",
  primaryActionRing: "--al-primary-action-ring",
  accentLink: "--al-accent-link",
  accentLinkHover: "--al-accent-link-hover",
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

/** Shared card chrome for operator surfaces — prefer over per-page `px-2.5` overrides. */
export const OPERATOR_CARD = {
  /** CardHeader: 16px inset, 12px title → body when paired with {@link OPERATOR_CARD.content}. */
  header: "flex flex-col space-y-1.5 p-4 pb-3",
  /** CardContent following a header (no duplicate top padding). */
  content: "p-4 pt-0",
  /** Single-block cards without a split header/content pair. */
  body: "p-4",
  /** Nested raised surface inside a card (metrics, run rows, empty states). */
  nested: "p-3",
} as const;

/** Tailwind class bundles for layout and surfaces (operator shell). */
export const OPERATOR_LAYOUT = {
  page: "bg-al-surface-base text-al-text-primary",
  /** Gap between items within a single functional zone (form fields, list rows). */
  sectionStack: "space-y-4",
  /** Gap between major page zones (hero → reviews → guidance). Target 24–32px. */
  majorSectionGap: "space-y-6",
  /** Section heading → content block (12px). */
  sectionHeadingStack: "space-y-3",
  /** Standalone section heading bottom margin when not using sectionHeadingStack. */
  sectionHeadingMargin: "mb-3",
  cardPadding: "p-4",
  /** Related controls (button groups, filter chips). Target 8–12px. */
  inlineGap: "gap-2",
  /** Related control clusters with labels. */
  controlClusterGap: "gap-3",
  /** Unrelated control groups (filters → table, CTA → body). Target 16–24px. */
  unrelatedClusterGap: "gap-4",
  disclosure: {
    default: "p-4",
    slim: "p-3",
    bodyOffset: "mt-4",
    bodyOffsetSlim: "mt-3",
  },
} as const;

/** Operator workflow page width variants — left-aligned rails (no `mx-auto`). */
export type OperatorPageContainerVariant = "full" | "workflow" | "dashboard" | "reading";

export const OPERATOR_PAGE_CONTAINER = {
  /** Shared operator page rail — shell already applies horizontal padding. */
  base: "w-full",
  variant: {
    /** Tables, filters, and multi-column workflow surfaces. */
    full: "w-full",
    /** Wizards and step-based flows (~1120px). */
    workflow: "w-full max-w-[1200px]",
    /** Portfolio, ROI dashboards, evidence trail (~1440px). */
    dashboard: "w-full max-w-[1440px]",
    /** Onboarding, settings forms, help prose (~768px) — still left-aligned to the rail. */
    reading: "w-full max-w-3xl",
  },
} as const;

/** Max shell width shared by operator top bar, sidebar row, and footer. */
export const OPERATOR_SHELL_MAX_WIDTH_CLASS = "w-full max-w-[1600px]";

/**
 * Four-tier operator typography (home + governance surfaces).
 * Prefer these over ad-hoc `text-xs` / `text-[10px]` on composed pages.
 * @see globals.css `.text-title` … `.text-meta` utilities (same scale)
 */
export const OPERATOR_TYPE_SCALE = {
  /** Page hero / primary card headline (20px). */
  title: "text-xl font-semibold leading-snug tracking-tight text-al-text-primary",
  /** Major in-card titles (16px). */
  cardTitle: "text-base font-semibold leading-snug text-al-text-primary",
  /** Zone / table group / tab labels (14px). */
  section: "text-sm font-semibold leading-snug text-al-text-primary",
  /** Default readable copy and table body (13px). */
  body: "text-[13px] font-normal leading-relaxed text-al-text-primary",
  /** Helper lines, captions, secondary table context (12px). */
  meta: "text-xs font-normal leading-snug text-al-text-secondary",
  /** Timestamps, KPI labels, dense metadata (11px). */
  micro: "text-[11px] font-normal leading-snug text-al-text-secondary",
} as const;

/** Zone headings on operator/buyer home — primary workspace surface (TB-347). */
export const OPERATOR_HOME_PRIMARY_SECTION_HEADING =
  "m-0 text-xl font-bold leading-snug tracking-tight text-al-text-primary";

/** Zone headings on operator/buyer home — one step below {@link OPERATOR_TYPE_SCALE.title} (BDA-135). */
export const OPERATOR_HOME_SECTION_HEADING =
  "m-0 text-lg font-semibold leading-snug tracking-tight text-al-text-primary";

/** Subsection labels inside home disclosure cards — sentence case. */
export const OPERATOR_HOME_SUBSECTION_LABEL = `m-0 ${OPERATOR_TYPE_SCALE.section} text-neutral-600 dark:text-neutral-400`;

/** Page-level actions (primary/secondary CTAs). */
export const OPERATOR_BUTTON_PAGE_CLASS = "h-9 px-4 text-[13px] font-medium";

/** Compact actions in tables and dense cards. */
export const OPERATOR_BUTTON_COMPACT_CLASS = "h-7 px-3 text-xs font-medium";

export const OPERATOR_TYPOGRAPHY = {
  pageTitle: OPERATOR_TYPE_SCALE.title,
  /** Legacy uppercase section labels — prefer {@link OPERATOR_TYPE_SCALE.section} on home. */
  sectionTitle: `${OPERATOR_TYPE_SCALE.section} text-al-text-secondary`,
  cardTitle: OPERATOR_TYPE_SCALE.cardTitle,
  body: OPERATOR_TYPE_SCALE.body,
  meta: OPERATOR_TYPE_SCALE.meta,
  label: OPERATOR_TYPE_SCALE.meta,
  /** Status chips (11px). Do not use arbitrary `text-[10px]` on operator surfaces. */
  badge: "text-[11px] font-medium leading-none",
  dataValue: `${OPERATOR_TYPE_SCALE.body} font-medium tabular-nums`,
  /** Dashboard / metric tiles only — not page titles. */
  kpiValue: "font-mono text-4xl font-semibold tabular-nums text-al-text-primary",
  /** Executive dashboard numbers (KPI tiles + ROI summary) — one treatment (BDA-139). */
  executiveDashboardMetric: "text-2xl font-semibold tabular-nums text-al-text-primary",
} as const;

export const DESIGN_TOKENS = {
  typography: OPERATOR_TYPOGRAPHY,
  surface: {
    page: OPERATOR_LAYOUT.page,
    card: "rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800",
    muted: "rounded-md border border-neutral-200 bg-neutral-100/80 dark:border-neutral-800 dark:bg-neutral-900/50",
  },
  accent: {
    link: "font-medium text-[var(--al-accent-link)] underline hover:text-[var(--al-accent-link-hover)]",
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
      `inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2.5 py-1 ${OPERATOR_TYPOGRAPHY.badge} text-al-text-primary no-underline hover:bg-[var(--al-layer-hover)] dark:border-neutral-600`,
    asidePanel: "rounded-lg border border-neutral-200 bg-al-surface-raised p-4 shadow-sm dark:border-neutral-800",
    navActive:
      "border-l-2 border-l-[var(--al-accent-interactive)] bg-[var(--al-layer-hover)] font-semibold text-al-text-primary dark:bg-neutral-800/80",
  },
  table: {
    shell: "w-full overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800",
    table: "w-full border-collapse text-[13px]",
    headRow: "border-b border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900",
    headCell:
      "px-3 py-2.5 text-left text-[11px] font-semibold leading-snug text-al-text-secondary",
    body: "divide-y divide-neutral-100 dark:divide-neutral-800",
    row: "outline-none transition-colors hover:bg-[var(--al-layer-hover)] dark:hover:bg-neutral-800/80",
    rowSelected:
      "border-l-2 border-l-[var(--al-accent-interactive)] bg-[var(--al-layer-hover)] dark:bg-neutral-800/80",
    cell: "px-3 py-3 align-top text-[13px] leading-snug text-al-text-primary",
    cellSecondary: "text-[13px] leading-snug text-al-text-secondary",
    rowLabel: `${OPERATOR_TYPE_SCALE.body} font-semibold`,
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
  "needs-attention": "Action needed",
  blocked: "Blocked",
  approved: "Approved",
  "approved-with-monitoring": "Approved with monitoring",
  "in-progress": "In progress",
  draft: "Draft",
  neutral: "—",
};

const STATUS_TAG_BASE =
  `inline-flex max-w-full min-h-[20px] items-center rounded-sm border px-2 py-0.5 ${OPERATOR_TYPOGRAPHY.badge}`;

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

export type FindingSeverityKind =
  | "critical"
  | "error"
  | "warning"
  | "high"
  | "medium"
  | "low"
  | "info"
  | "unknown";

export const SEVERITY_LABELS: Readonly<Record<FindingSeverityKind, string>> = {
  critical: "Critical",
  error: "Error",
  warning: "Warning",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
  unknown: "Unknown",
};

export function normalizeFindingSeverity(raw: string | null | undefined): FindingSeverityKind {
  const s = (raw ?? "").trim().toLowerCase();

  switch (s) {
    case "critical":
      return "critical";

    case "error":
      return "error";

    case "warning":
      return "warning";

    case "info":
    case "informational":
      return "info";

    case "high":
      return "high";

    case "medium":
    case "moderate":
      return "medium";

    case "low":
      return "low";

    default:
      break;
  }

  if (s.includes("critical")) {
    return "critical";
  }

  if (s.includes("error")) {
    return "error";
  }

  if (s.includes("warning")) {
    return "warning";
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

    case "error":
    case "high":
      return `${STATUS_TAG_BASE} border-amber-800/50 bg-[var(--al-status-warn-bg)] text-[var(--al-status-warn-fg)]`;

    case "warning":
    case "medium":
      return `${STATUS_TAG_BASE} border-amber-600/40 bg-al-surface-raised text-al-text-primary`;

    case "low":
      return `${STATUS_TAG_BASE} border-neutral-400 bg-al-surface-raised text-al-text-secondary`;

    case "info":
      return `${STATUS_TAG_BASE} border-blue-700/40 bg-al-surface-raised text-al-text-primary`;

    case "unknown":
      return `${STATUS_TAG_BASE} border-neutral-300 bg-al-surface-raised text-al-text-secondary`;

    default: {
      const exhaustive: never = kind;

      return exhaustive;
    }
  }
}
