/**
 * Public marketing design tokens — wider rails and type scale than operator views.
 * @see docs/library/UI_DESIGN_SYSTEM.md
 */

import { cn } from "@/lib/utils";
import {
  DESIGN_TOKENS,
  OPERATOR_KPI_CARD_DESCRIPTION,
  OPERATOR_KPI_CARD_TITLE,
  OPERATOR_KPI_VALUE,
  OPERATOR_LAYOUT,
  OPERATOR_PAGE_CONTAINER,
  OPERATOR_TYPOGRAPHY,
  OPERATOR_TYPE_SCALE,
} from "./design-tokens-shell";

/** Public marketing chrome — shares operator al-* palette; wider rail and type scale than operator views. */
export const MARKETING_LAYOUT = {
  page: OPERATOR_LAYOUT.page,
  main: "mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12",
  /** Public trust and assurance pages — wider rail aligned with marketing header (max-w-6xl). */
  mainTrust: "mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10",
  mainReading: `mx-auto ${OPERATOR_PAGE_CONTAINER.variant.reading} px-4 py-10`,
  /** Public onboarding / get-started — wider centered rail for path cards and milestone grids. */
  mainOnboarding: "mx-auto w-full max-w-[72rem] px-4 py-10 sm:px-6",
  /** Full-bleed welcome hero band — sits above the main content rail. */
  heroBand:
    "relative w-full border-b border-neutral-200 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-950/60",
  heroBandInner: "mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20",
  sectionStack: "mb-16",
  sectionGap: "mt-10",
  majorSectionGap: "mt-12",
} as const;

export const MARKETING_TYPOGRAPHY = {
  /** In-app marketing pages (pricing header, FAQ) — one step above operator page titles. */
  pageTitle: "text-2xl font-semibold leading-8 tracking-tight text-al-text-primary sm:text-3xl",
  /** Welcome / see-it hero headlines. */
  heroTitle:
    "text-3xl font-semibold leading-tight tracking-tight text-al-text-primary sm:text-4xl lg:text-5xl",
  sectionTitle: "text-2xl font-semibold leading-tight tracking-tight text-al-text-primary",
  cardTitle: OPERATOR_TYPOGRAPHY.cardTitle,
  /** Marketing body — ~17px for public landing readability (not operator 13px). */
  body: "text-[17px] font-normal leading-7 text-al-text-primary",
  /** Hero and pricing intros — slightly larger than marketing body copy. */
  lead: "text-[17px] leading-7 text-neutral-700 sm:text-lg sm:leading-8 dark:text-neutral-300",
  /** Marketing metadata — ~15px captions (not operator 12px helper). */
  meta: "text-[15px] font-normal leading-6 text-al-text-secondary",
  // teal-900 (≥4.5:1 on marketing hero bands); teal-800 fails axe on neutral-50.
  eyebrow: `${OPERATOR_TYPOGRAPHY.helper} font-semibold uppercase tracking-wide text-teal-900 dark:text-teal-200`,
  formLabel: `${OPERATOR_TYPE_SCALE.body} font-medium text-al-text-primary`,
} as const;

/** Narrow marketing capture column (~28–30rem) for evaluation signup and similar forms. */
export const MARKETING_FORM_COLUMN_CLASS = "w-full max-w-[30rem]" as const;

/** Motion-safe marketing entrance — pair with globals `.marketing-reveal-in`. */
export const MARKETING_MOTION = {
  revealIn: "marketing-reveal-in",
  heroVisual: "marketing-hero-visual",
} as const;

/** Sponsor buyer shell — reuses operator scale; eyebrow matches marketing entry surfaces. */
export const SPONSOR_TYPOGRAPHY = {
  eyebrow: MARKETING_TYPOGRAPHY.eyebrow,
  pageTitle: OPERATOR_TYPOGRAPHY.pageTitle,
  lead: `${OPERATOR_TYPOGRAPHY.body} text-al-text-secondary`,
  sectionTitle: OPERATOR_TYPOGRAPHY.sectionTitle,
  cardTitle: OPERATOR_TYPOGRAPHY.cardTitle,
  body: OPERATOR_TYPOGRAPHY.body,
  helper: OPERATOR_TYPOGRAPHY.helper,
  formLabel: `${OPERATOR_TYPOGRAPHY.body} font-medium text-al-text-primary`,
  kpiLabel: OPERATOR_KPI_CARD_TITLE,
  kpiValue: OPERATOR_KPI_VALUE,
  kpiCaption: OPERATOR_KPI_CARD_DESCRIPTION,
} as const;

export const MARKETING_SURFACES = {
  card: `${DESIGN_TOKENS.surface.card} p-4`,
  cardComfort: `${DESIGN_TOKENS.surface.card} p-5`,
  sectionPanel: `${DESIGN_TOKENS.surface.card} p-4 sm:p-5`,
  highlightPanel: DESIGN_TOKENS.banner.page,
  mutedPanel: `${DESIGN_TOKENS.surface.muted} p-4`,
  link: DESIGN_TOKENS.accent.link,
  inlineLink:
    "font-medium text-[var(--al-accent-link)] underline underline-offset-2 hover:text-[var(--al-accent-link-hover)]",
  stepIndicator:
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-al-surface-raised text-sm font-semibold text-al-text-primary dark:border-neutral-800",
} as const;

/**
 * Button width affordances (Carbon-style).
 * Prefer {@link CTA_WIDTH.content} for card footers, heroes, and short-label actions.
 * Use {@link CTA_WIDTH.formMatch} only to align submits with full-width fields in a narrow form column.
 * Use {@link CTA_WIDTH.listRow} only for stacked navigational hit-targets in a constrained rail/list — never for short labels spanning a wide card or hero.
 */
export const CTA_WIDTH = {
  content: "w-fit max-w-full",
  formMatch: "w-full sm:w-auto",
  listRow: "w-full",
} as const;

/** Outline hero CTA sizing/contrast — never combine with {@link OPERATOR_TYPOGRAPHY.body} on the same control (overrides button fg). */
export const MARKETING_HERO_SECONDARY_CTA_CLASS =
  `h-11 min-h-11 ${CTA_WIDTH.content} border-neutral-300 bg-white px-8 text-neutral-900 shadow-sm hover:bg-neutral-100 sm:min-w-[12rem] dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800`;

/** Filled primary shell for marketing badges/step indicators — mirrors operator `Button` variant `primary` fill. */
export const MARKETING_PRIMARY_FILL_CLASS =
  "bg-[var(--al-primary-action-bg)] text-[var(--al-primary-action-fg)]";

/** Primary marketing CTA anchor — shares `--al-primary-action-*` with operator `Button` variant `primary` (**TB-2292**). */
export const MARKETING_PRIMARY_CTA_CLASS = cn(
  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium no-underline",
  "hover:bg-[var(--al-primary-action-bg-hover)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-primary-action-ring)] focus-visible:ring-offset-2",
  MARKETING_PRIMARY_FILL_CLASS,
);

/** Secondary caption on marketing/demo surfaces — passes 4.5:1 on `--al-surface-base` (avoid `text-neutral-500` at 11–12px). */
export const MARKETING_CAPTION_TEXT_CLASS = "text-neutral-600 dark:text-neutral-400";
