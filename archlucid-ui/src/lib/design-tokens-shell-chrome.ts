/**
 * Operator shell chrome tokens — CSS variables, surfaces, callouts, and interactive affordances.
 * @see docs/library/UI_DESIGN_SYSTEM.md
 */

import { OPERATOR_LAYOUT } from "./design-tokens-shell-layout";
import { OPERATOR_TYPOGRAPHY, OPERATOR_TYPE_SCALE } from "./design-tokens-shell-typography";

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
  statusNeutralBg: "--al-status-neutral-bg",
  statusNeutralFg: "--al-status-neutral-fg",
  statusNeutralBorder: "--al-status-neutral-border",
  dangerActionBg: "--al-danger-action-bg",
  dangerActionBgHover: "--al-danger-action-bg-hover",
  dangerActionFg: "--al-danger-action-fg",
  dangerActionRing: "--al-danger-action-ring",
  dangerText: "--al-danger-text",
  dangerSurfaceBg: "--al-danger-surface-bg",
  dangerSurfaceBorder: "--al-danger-surface-border",
  dangerSurfaceFg: "--al-danger-surface-fg",
  layerHover: "--al-layer-hover",
} as const;

/**
 * Destructive affordances (TB-2375). Raw `bg-red-*` / `text-red-*` utilities do not track dark
 * mode, so destructive controls drifted between primitives — `Button variant="destructive"` used
 * `dark:bg-red-600` while `AlertDialogAction` used `dark:bg-red-900` for the same confirm.
 */
export const OPERATOR_DANGER = {
  /** Destructive button/action fill. Prefer `Button variant="destructive"` over applying directly. */
  action:
    "bg-[var(--al-danger-action-bg)] text-[var(--al-danger-action-fg)] hover:bg-[var(--al-danger-action-bg-hover)] focus-visible:ring-[var(--al-danger-action-ring)]",
  /** Inline error text beside or beneath a control. */
  text: "text-[var(--al-danger-text)]",
  /** Error banner / callout surface. */
  surface:
    "border border-[var(--al-danger-surface-border)] bg-[var(--al-danger-surface-bg)] text-[var(--al-danger-surface-fg)]",
} as const;

/** Inverse tooltip surface — paired with `--al-tooltip-*` in `globals.css`; do not reuse page caption tokens inside tooltips. */
export const TOOLTIP_SURFACE = {
  content:
    "border border-[var(--al-tooltip-border)] bg-[var(--al-tooltip-bg)] text-[var(--al-tooltip-fg)] shadow-[var(--al-tooltip-shadow)]",
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
    warn: "rounded-md border border-amber-600/60 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/60",
    warnShell:
      "flex gap-3 rounded-md border border-amber-600/60 border-l-4 border-l-amber-600 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/60 dark:border-l-amber-500",
    blocked:
      "rounded-md border border-rose-600/60 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-rose-700/60",
    blockedShell:
      "flex gap-3 rounded-md border border-rose-600/60 border-l-4 border-l-rose-600 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-rose-700/60 dark:border-l-rose-500",
    info: "rounded-md border border-neutral-300 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-neutral-700",
    neutral:
      "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 text-sm text-al-text-secondary dark:border-neutral-800",
  },
  calloutSeverity: {
    warn: {
      label: "Caution",
      labelClass: "text-amber-900 dark:text-amber-200",
      iconClass: "text-amber-800 dark:text-amber-200",
    },
    blocked: {
      label: "Blocked",
      labelClass: "text-rose-900 dark:text-rose-200",
      iconClass: "text-rose-800 dark:text-rose-200",
    },
  },
  banner: {
    page:
      "rounded-xl border border-neutral-200 border-l-4 border-l-[var(--al-accent-interactive)] bg-al-surface-raised px-5 py-4 shadow-sm dark:border-neutral-800",
    trial:
      "rounded-xl border border-neutral-200 border-l-4 border-l-amber-600 bg-al-surface-raised px-5 py-4 shadow-sm dark:border-neutral-800",
    governanceApproval:
      "rounded-md border border-neutral-200 border-l-4 border-l-[var(--al-status-approved-monitoring-fg)] bg-[var(--al-status-approved-monitoring-bg)] px-4 py-3 dark:border-neutral-800",
  },
  interactive: {
    rowHover:
      "transition-colors hover:border-neutral-300 hover:bg-[var(--al-layer-hover)] dark:hover:border-neutral-700 dark:hover:bg-neutral-800/80",
    chip:
      `inline-flex min-h-8 items-center rounded-md border border-neutral-300 bg-al-surface-raised px-3 py-1 ${OPERATOR_TYPOGRAPHY.nativeControlLabel} text-al-text-primary no-underline hover:bg-[var(--al-layer-hover)] dark:border-neutral-600`,
    asidePanel: "rounded-lg border border-neutral-200 bg-al-surface-raised p-4 shadow-sm dark:border-neutral-800",
    navActive:
      "border-l-2 border-l-[var(--al-accent-interactive)] bg-[var(--al-layer-hover)] font-semibold text-al-text-primary dark:bg-neutral-800/80",
  },
  table: {
    shell: "w-full overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800",
    table: "w-full border-collapse text-[13px]",
    headRow: "border-b border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900",
    headCell: `px-3 py-2.5 text-left ${OPERATOR_TYPE_SCALE.tab} text-al-text-secondary`,
    body: "divide-y divide-neutral-100 dark:divide-neutral-800",
    row: "content-visibility-auto outline-none transition-colors hover:bg-[var(--al-layer-hover)] dark:hover:bg-neutral-800/80",
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

/** TB-2279 — filled teal is for forward/irreversible workflow commits only; navigation opens use outline/link. */
export const OPERATOR_PRIMARY_FILL_USAGE_CONTRACT = {
  filledPrimary:
    "Use Button variant=\"primary\" (filled teal) only for forward or irreversible workflow commits — start review, submit, approve, save.",
  navigationOpens:
    "Use variant=\"outline\", quiet text links, or OPERATOR_LINK for opening another surface — drafts list, help topic, audit trail, settings tab.",
} as const;

/** TB-2290 — operator Button variant/color matrix; see UI_DESIGN_SYSTEM.md § Button variant/color matrix. */
export const OPERATOR_BUTTON_VARIANT_COLOR_MATRIX = {
  canonicalSource: "archlucid-ui/src/components/ui/button.tsx",
  variants: ["primary", "outline", "default", "secondary", "destructive"] as const,
  bannedClassNamePrefixes: ["bg-teal-", "bg-emerald-", "bg-rose-", "bg-amber-", "text-teal-"] as const,
  filledPrimaryRule: OPERATOR_PRIMARY_FILL_USAGE_CONTRACT.filledPrimary,
  navigationOpensRule: OPERATOR_PRIMARY_FILL_USAGE_CONTRACT.navigationOpens,
} as const;
