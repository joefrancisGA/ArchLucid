/**
 * Operator shell typography tokens — type scale, headings, links, and form labels.
 * @see docs/library/UI_DESIGN_SYSTEM.md
 */

import { cn } from "@/lib/utils";

/**
 * Canonical operator type scale — one treatment per role; avoid ad-hoc size/weight pairs.
 * CSS utilities in `globals.css` (`.text-page-title`, …) mirror these tokens.
 * @see docs/library/UI_DESIGN_SYSTEM.md — Typography convention (TB-119)
 */
export const OPERATOR_TYPE_SCALE = {
  /** Page title — 20/28, semibold. */
  pageTitle: "text-xl font-semibold leading-7 tracking-tight text-al-text-primary",
  /** Section heading — 18/26, semibold. */
  sectionTitle: "text-lg font-semibold leading-[26px] text-al-text-primary",
  /** Card / subsection title — 15/22, semibold. */
  cardTitle: "text-[15px] font-semibold leading-[22px] text-al-text-primary",
  /** Body — 13/20, normal. */
  body: "text-[13px] font-normal leading-5 text-al-text-primary",
  /** Help topic long-form body — 15/24 (~1.6) for procurement and security reading surfaces. */
  helpReadingBody: "text-[15px] font-normal leading-6 text-al-text-primary",
  /** Helper / caption — 12/18, normal. */
  helper: "text-xs font-normal leading-[18px] text-al-text-secondary",
  /** Sidebar nav item — 13/18, medium. */
  navLabel: "text-[13px] font-medium leading-[18px] text-al-text-primary",
  /** Sidebar nav helper — 11/15, normal (sparse use). */
  navHelper: "text-[11px] font-normal leading-[15px] text-al-text-secondary",
  /** Button label — 11/15, bold; matches execution-mode top-bar chip size (REAL). */
  button: "text-[11px] font-bold leading-[15px]",
  /**
   * Native `<button>` segmented options, filter chips, and compact triggers — 11/15 bold.
   * Do not reuse {@link OPERATOR_TYPOGRAPHY.button} here; that scale is reserved for visible-boundary Buttons.
   */
  nativeControlLabel: "text-[11px] font-bold leading-[15px]",
  /** Tab / table header label — 12/16, semibold. */
  tab: "text-xs font-semibold leading-4 text-al-text-primary",
  /** Dense metadata / chips — 11/15, normal. */
  micro: "text-[11px] font-normal leading-[15px] text-al-text-secondary",
} as const;

/** Sidebar group labels — uppercase tab scale. */
export const OPERATOR_NAV_GROUP_LABEL = `${OPERATOR_TYPE_SCALE.tab} uppercase tracking-wide text-al-text-secondary`;

/** Zone headings on operator/buyer home — dominant workspace surface (TB-347). */
export const OPERATOR_HOME_PRIMARY_SECTION_HEADING =
  "m-0 text-xl font-bold leading-7 tracking-tight text-al-text-primary";

/** Home workspace inventory counter — number dominant, label muted (not link-styled). */
export const OPERATOR_HOME_METRIC_COUNTER_VALUE =
  "text-lg font-semibold tabular-nums leading-7 text-al-text-primary";

/** Home workspace inventory counter label beside {@link OPERATOR_HOME_METRIC_COUNTER_VALUE}. */
export const OPERATOR_HOME_METRIC_COUNTER_LABEL =
  `${OPERATOR_TYPE_SCALE.helper} text-al-text-secondary`;

/** Peer overview card h2 — matches {@link OPERATOR_TYPE_SCALE.cardTitle} and CardTitle chrome. */
export const OPERATOR_HOME_CARD_SECTION_HEADING = `m-0 tracking-tight ${OPERATOR_TYPE_SCALE.cardTitle}`;

/** Lifecycle path card h3 — one step below peer card h2; must not borrow sectionTitle scale. */
export const OPERATOR_HOME_LIFECYCLE_CARD_TITLE = `m-0 ${OPERATOR_TYPE_SCALE.cardTitle}`;

/** Zone headings one step below primary — e.g. First-hour path, Latest in workspace. */
export const OPERATOR_HOME_SECTION_HEADING = `m-0 ${OPERATOR_TYPE_SCALE.sectionTitle}`;

/** Accordion / disclosure triggers and tertiary labels — sentence case. */
export const OPERATOR_HOME_SUBSECTION_LABEL = `m-0 ${OPERATOR_TYPE_SCALE.cardTitle} text-al-text-secondary`;

/** Tertiary accordion trigger on dense operator surfaces. */
export const OPERATOR_DISCLOSURE_TRIGGER_CLASS = `${OPERATOR_TYPE_SCALE.cardTitle} text-al-text-secondary`;

/** KPI / metric tile label on dashboard, portfolio, and scorecard cards. */
export const OPERATOR_KPI_CARD_TITLE = `${OPERATOR_TYPE_SCALE.tab} text-al-text-secondary`;

/** KPI / metric tile caption under the label. */
export const OPERATOR_KPI_CARD_DESCRIPTION = OPERATOR_TYPE_SCALE.helper;

/** KPI / metric tile primary value — scorecard and portfolio headline numbers. */
export const OPERATOR_KPI_VALUE =
  "text-3xl font-semibold tabular-nums tracking-tight text-al-text-primary";

/** Page-level actions (primary/secondary CTAs). */
export const OPERATOR_BUTTON_PAGE_CLASS = `h-9 px-4 ${OPERATOR_TYPE_SCALE.button}`;

/** Compact actions in tables and dense cards — same label scale as page buttons. */
export const OPERATOR_BUTTON_COMPACT_CLASS = `h-7 px-3 ${OPERATOR_TYPE_SCALE.button}`;

/** Inline link treatments — reserve strong teal underline for navigation, not step labels. */
const OPERATOR_LINK_FOCUS =
  "rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)]";

export const OPERATOR_LINK = {
  nav: cn(
    "inline-flex min-h-8 items-center font-medium text-[var(--al-accent-link)] underline underline-offset-2 hover:text-[var(--al-accent-link-hover)]",
    OPERATOR_LINK_FOCUS,
  ),
  inline: cn(
    "font-medium text-al-text-primary underline decoration-al-text-secondary/35 underline-offset-2 hover:text-[var(--al-accent-link)] hover:decoration-[var(--al-accent-link)]",
    OPERATOR_LINK_FOCUS,
  ),
  step: cn(
    "font-medium text-al-text-primary no-underline hover:text-[var(--al-accent-link)] hover:underline underline-offset-2",
    OPERATOR_LINK_FOCUS,
  ),
  /** Compact bordered chip for numbered journey steps — clearly interactive without primary-button weight. */
  stepPill:
    "inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-[13px] font-medium leading-5 text-al-text-primary shadow-sm transition-colors hover:border-[var(--al-accent-interactive)] hover:bg-al-surface-raised hover:text-[var(--al-accent-link)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-interactive)] focus-visible:ring-offset-2 dark:border-neutral-600 dark:bg-neutral-900 dark:hover:bg-neutral-800",
  /** Highlights the journey step that matches the current route. */
  stepPillCurrent:
    "border-[var(--al-accent-interactive)] bg-al-surface-raised text-al-text-primary ring-1 ring-[var(--al-accent-interactive)]/35",
  /** Highlights the suggested next step when the operator is not already on a journey route. */
  stepPillRecommended:
    "border-neutral-400 bg-al-surface-raised dark:border-neutral-500",
  optional: cn(
    `${OPERATOR_TYPE_SCALE.helper} font-medium text-al-text-secondary underline decoration-al-text-secondary/40 underline-offset-2 hover:text-al-text-primary hover:decoration-[var(--al-accent-interactive)]`,
    OPERATOR_LINK_FOCUS,
  ),
} as const;

/** Body-scale inline links in operator tables, banners, and list rows (TB-1671). */
export const OPERATOR_BODY_INLINE_LINK_CLASS = cn(OPERATOR_TYPE_SCALE.body, OPERATOR_LINK.inline);

/**
 * Form field caption — `<Label>` and `<legend>` on operator forms (TB-2111).
 * Never compose with {@link OPERATOR_TYPOGRAPHY.body}: it carries `font-normal`, which wins in Tailwind merge.
 */
export const OPERATOR_FORM_FIELD_LABEL_CLASS = "text-[13px] font-semibold leading-5 text-al-text-primary";

/**
 * Multi-line helper copy under a control — relaxed leading vs default helper crush. TB-2000.
 */
export const OPERATOR_FORM_FIELD_HELPER_CLASS = `${OPERATOR_TYPE_SCALE.helper} leading-relaxed`;

/** Semibold scan marker on inline guidance lines — pair with normal-weight body copy after the colon. */
export const INLINE_GUIDANCE_LABEL_CLASS = "font-semibold text-al-text-primary";

/** @deprecated Use {@link INLINE_GUIDANCE_LABEL_CLASS}. */
export const OPERATOR_GUIDANCE_NEXT_LABEL_CLASS = INLINE_GUIDANCE_LABEL_CLASS;

/**
 * Medium scan marker for inline metadata keys (`Label: value`) — quieter than guidance semibold.
 * Pair with normal-weight value text; do not use for instructional prefixes (use {@link INLINE_GUIDANCE_LABEL_CLASS}).
 */
export const INLINE_METADATA_LABEL_CLASS = "font-medium text-al-text-primary";

export const OPERATOR_TYPOGRAPHY = {
  pageTitle: OPERATOR_TYPE_SCALE.pageTitle,
  sectionTitle: OPERATOR_TYPE_SCALE.sectionTitle,
  cardTitle: OPERATOR_TYPE_SCALE.cardTitle,
  body: OPERATOR_TYPE_SCALE.body,
  helper: OPERATOR_TYPE_SCALE.helper,
  label: OPERATOR_TYPE_SCALE.helper,
  navLabel: OPERATOR_TYPE_SCALE.navLabel,
  navHelper: OPERATOR_TYPE_SCALE.navHelper,
  button: OPERATOR_TYPE_SCALE.button,
  nativeControlLabel: OPERATOR_TYPE_SCALE.nativeControlLabel,
  tab: OPERATOR_TYPE_SCALE.tab,
  micro: OPERATOR_TYPE_SCALE.micro,
  /** Status chips (11px). Do not use arbitrary `text-[10px]` on operator surfaces. */
  badge: "text-[11px] font-medium leading-none",
  dataValue: `${OPERATOR_TYPE_SCALE.body} font-medium tabular-nums`,
  /** Dashboard / metric tiles only — not page titles. */
  kpiValue: "font-mono text-4xl font-semibold tabular-nums lining-nums text-al-text-primary [font-variant-numeric:lining-nums]",
  /** Sponsor dashboard numbers (KPI tiles + ROI summary) — one treatment (BDA-139). */
  executiveDashboardMetric: "text-2xl font-semibold tabular-nums text-al-text-primary",
} as const;

export const TOOLTIP_TYPOGRAPHY = {
  body: "text-[13px] font-normal leading-5 text-[var(--al-tooltip-fg)]",
  title: "text-[13px] font-semibold leading-5 text-[var(--al-tooltip-fg)]",
  muted: "text-xs font-normal leading-[18px] text-[var(--al-tooltip-fg-muted)]",
  link: "font-medium text-[var(--al-tooltip-link)] underline decoration-[var(--al-tooltip-link)]/60 underline-offset-2 hover:text-[var(--al-tooltip-link-hover)] hover:decoration-[var(--al-tooltip-link-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-tooltip-link)]",
} as const;

/** GitBook-like reading column — descendant typography for {@link DocumentLayout}. */
export const OPERATOR_DOCUMENT_ARTICLE_BODY = [
  "[&_p]:text-[13px] [&_p]:leading-relaxed",
  "[&_h2]:scroll-mt-20 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-neutral-900 dark:[&_h2]:text-neutral-50",
  "[&_h3]:scroll-mt-20 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-neutral-900 dark:[&_h3]:text-neutral-100",
  "[&_h4]:scroll-mt-16 [&_h4]:text-[13px] [&_h4]:font-semibold [&_h4]:text-neutral-900 dark:[&_h4]:text-neutral-100",
  "[&_.doc-meta]:text-xs [&_.doc-meta]:text-neutral-500 dark:[&_.doc-meta]:text-neutral-400",
  "[&_ul]:my-0 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-[13px] [&_ul]:leading-relaxed",
  "[&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_pre]:rounded-md [&_pre]:border [&_pre]:border-neutral-200 [&_pre]:bg-neutral-100 [&_pre]:p-3 [&_pre]:text-xs dark:[&_pre]:border-neutral-700 dark:[&_pre]:bg-neutral-800",
  "[&_table]:w-full [&_table]:border-collapse [&_table]:text-xs",
  "[&_thead_th]:border-b [&_thead_th]:border-neutral-200 [&_thead_th]:bg-neutral-50/90 [&_thead_th]:p-2 [&_thead_th]:text-left [&_thead_th]:font-semibold dark:[&_thead_th]:border-neutral-700 dark:[&_thead_th]:bg-neutral-900/50",
  "[&_tbody_tr:nth-child(odd)]:bg-neutral-50/70 dark:[&_tbody_tr:nth-child(odd)]:bg-neutral-900/35",
  "[&_td]:border-b [&_td]:border-neutral-100 [&_td]:p-2 [&_td]:align-top dark:[&_td]:border-neutral-800",
].join(" ");
