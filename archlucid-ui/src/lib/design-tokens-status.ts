/**
 * Enterprise status and severity design tokens.
 * @see docs/library/UI_DESIGN_SYSTEM.md
 */

import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "./design-tokens-shell";

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
  neutral: " — ",
};

/** Non-interactive metadata label shell — flat soft labels, not buttons or filter chips. */
export const METADATA_STATUS_TAG_SHELL =
  `inline-flex max-w-full items-center rounded px-1.5 py-0.5 cursor-default select-none pointer-events-none ${OPERATOR_TYPOGRAPHY.micro} font-medium leading-tight`;

/**
 * Findings rows sit tags inline with a 13px finding title, where the 11px shell reads as a size
 * jump rather than a hierarchy step. Apply to every tag in such a row so they stay uniform.
 */
export const FINDINGS_ROW_METADATA_TAG_SIZE = "text-xs leading-4";

/**
 * Design-system distinction:
 * - {@link StatusTag} / {@link SeverityTag} / {@link StatusPill} → noninteractive metadata (`status`, `severity`, `metadata`)
 * - {@link INTERACTIVE_FILTER_CHIP_SHELL} / `Badge` action variants → interactive filter/action chips only
 */
export const INTERACTIVE_FILTER_CHIP_SHELL = DESIGN_TOKENS.interactive.chip;

const STATUS_TAG_BASE = METADATA_STATUS_TAG_SHELL;

const STATUS_TAG_SHAPE =
  "border border-neutral-200/70 border-l-[3px] dark:border-neutral-700/70";

export function enterpriseStatusTagClass(kind: EnterpriseStatusKind): string {
  return `${STATUS_TAG_BASE} ${STATUS_TAG_SHAPE} ${enterpriseStatusMetadataFillClass(kind)} ${enterpriseStatusTagAccentBorderClass(kind)}`;
}

/** Flat metadata fills for legacy `StatusPill` — token-backed, no left-accent border. */
export function enterpriseStatusMetadataFillClass(kind: EnterpriseStatusKind): string {
  switch (kind) {
    case "ready":
      return "bg-[var(--al-status-ready-bg)] text-[var(--al-status-ready-fg)]";

    case "needs-attention":
      return "bg-[var(--al-status-warn-bg)] text-[var(--al-status-warn-fg)]";

    case "blocked":
      return "bg-[var(--al-status-blocked-bg)] text-[var(--al-status-blocked-fg)]";

    case "approved":
      return "bg-[var(--al-status-approved-bg)] text-[var(--al-status-approved-fg)]";

    case "approved-with-monitoring":
      return "bg-[var(--al-status-approved-monitoring-bg)] text-[var(--al-status-approved-monitoring-fg)]";

    case "in-progress":
      return "bg-sky-100 text-sky-950 dark:bg-sky-950/60 dark:text-sky-100";

    case "draft":
    case "neutral":
    default:
      return "bg-[var(--al-status-neutral-bg)] text-[var(--al-status-neutral-fg)]";
  }
}

function enterpriseStatusTagAccentBorderClass(kind: EnterpriseStatusKind): string {
  switch (kind) {
    case "ready":
      return "border-l-emerald-600 dark:border-l-emerald-500";

    case "needs-attention":
      return "border-l-amber-600 dark:border-l-amber-500";

    case "blocked":
      return "border-l-rose-600 dark:border-l-rose-500";

    case "approved":
      return "border-l-emerald-600 dark:border-l-emerald-500";

    case "approved-with-monitoring":
      return "border-l-cyan-800 dark:border-l-cyan-500";

    case "in-progress":
      return "border-l-sky-700 dark:border-l-sky-500";

    case "draft":
    case "neutral":
    default:
      return "border-l-[var(--al-status-neutral-border)] dark:border-l-[var(--al-status-neutral-border)]";
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
  unknown: "Unclassified",
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
      return `${STATUS_TAG_BASE} border-l-2 border-l-[var(--al-accent-interactive)] bg-al-surface-raised text-al-text-primary`;

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
      return `${STATUS_TAG_BASE} bg-[var(--al-status-blocked-bg)] text-[var(--al-status-blocked-fg)]`;

    case "error":
    case "high":
      return `${STATUS_TAG_BASE} bg-[var(--al-status-warn-bg)] text-[var(--al-status-warn-fg)]`;

    case "warning":
    case "medium":
      return `${STATUS_TAG_BASE} bg-amber-500/12 text-amber-950 dark:bg-amber-500/18 dark:text-amber-200`;

    case "low":
      return `${STATUS_TAG_BASE} bg-neutral-500/10 text-al-text-secondary dark:bg-neutral-500/15`;

    case "info":
      return `${STATUS_TAG_BASE} bg-slate-500/10 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300`;

    case "unknown":
      return `${STATUS_TAG_BASE} border-dashed border-neutral-400/70 bg-al-surface-raised text-al-text-secondary dark:border-neutral-600`;

    default: {
      const exhaustive: never = kind;

      return exhaustive;
    }
  }
}
