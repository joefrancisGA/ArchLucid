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
  /** Lifecycle path card that matches the current workspace phase (left accent only). */
  lifecycleEmphasized:
    "border-l-4 border-l-teal-700 dark:border-l-teal-500",
  /** Grouped examples / learning resources below workspace activity. */
  learningResourcesSurface:
    "rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/50",
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
  /** Primary column + sticky setup aside (~17.5rem) at lg+. */
  mainWithStickyAside: "grid gap-6 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start",
  /** Sticky positioning for setup-progress aside columns. */
  stickyAsideTop: "lg:sticky lg:top-4",
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
 * Sidebar + main content row beneath the sticky header.
 * Left-aligned with the top bar brand rail — never `mx-auto` (wide viewports otherwise gain a dead left gutter).
 */
export const OPERATOR_SHELL_BODY_ROW_CLASS = "flex min-h-0 w-full flex-1";

/** Primary sidebar column width — top-bar brand rail uses {@link OPERATOR_SHELL_SIDEBAR_WIDTH_LG_CLASS}. */
export const OPERATOR_SHELL_SIDEBAR_WIDTH_CLASS = "w-[15rem]";

/** Horizontal padding inside the sidebar column — matches top-bar brand rail at `lg`. */
export const OPERATOR_SHELL_SIDEBAR_PADDING_CLASS = "px-3 py-4";

/**
 * Horizontal padding for main content and chrome aligned to that rail.
 * 16px at all breakpoints — tighter to the sidebar than a former `lg:px-6` gutter.
 */
export const OPERATOR_SHELL_CONTENT_PADDING_X_CLASS = "px-4";

/** Main column padding: shared X + compact vertical (extra top/bottom at lg). */
export const OPERATOR_SHELL_MAIN_PADDING_CLASS = "px-4 py-4 lg:py-6";

/**
 * Sticky wizard footers that bleed to the shell content edge (negate {@link OPERATOR_SHELL_CONTENT_PADDING_X_CLASS}).
 */
export const OPERATOR_SHELL_CONTENT_BLEED_X_CLASS = "-mx-4 px-4";

/**
 * Scroll offset for in-page anchors below the sticky operator header stack.
 * Sticky budget is optional trial banner + one-row top bar; journey captions are non-sticky.
 */
export const OPERATOR_SHELL_SCROLL_OFFSET_CLASS = "scroll-mt-[var(--app-shell-sticky,6rem)]";

/** Sticky sub-nav offset below the operator header stack (TOC rails, section nav). */
export const OPERATOR_SHELL_STICKY_TOP_CLASS = "top-[calc(var(--app-shell-sticky,6rem)+0.5rem)]";

/** Sidebar width from the `lg` breakpoint — matches hidden sidebar below `lg`. */
export const OPERATOR_SHELL_SIDEBAR_WIDTH_LG_CLASS = "lg:w-[15rem]";

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
  /** Button label — 13/18, semibold. */
  button: "text-[13px] font-semibold leading-[18px]",
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

/** Peer overview card h2 — matches {@link OPERATOR_TYPE_SCALE.cardTitle} and CardTitle chrome. */
export const OPERATOR_HOME_CARD_SECTION_HEADING = `m-0 tracking-tight ${OPERATOR_TYPE_SCALE.cardTitle}`;

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

/** Compact actions in tables and dense cards. */
export const OPERATOR_BUTTON_COMPACT_CLASS = `h-7 px-3 ${OPERATOR_TYPE_SCALE.tab}`;

/** Inline link treatments — reserve strong teal underline for navigation, not step labels. */
export const OPERATOR_LINK = {
  nav: "font-medium text-[var(--al-accent-link)] underline underline-offset-2 hover:text-[var(--al-accent-link-hover)]",
  inline:
    "font-medium text-al-text-primary underline decoration-al-text-secondary/35 underline-offset-2 hover:text-[var(--al-accent-link)] hover:decoration-[var(--al-accent-link)]",
  step: "font-medium text-al-text-primary no-underline hover:text-[var(--al-accent-link)] hover:underline underline-offset-2",
  /** Compact bordered chip for numbered journey steps — clearly interactive without primary-button weight. */
  stepPill:
    "inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-[13px] font-medium leading-5 text-al-text-primary shadow-sm transition-colors hover:border-[var(--al-accent-interactive)] hover:bg-al-surface-raised hover:text-[var(--al-accent-link)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-interactive)] focus-visible:ring-offset-2 dark:border-neutral-600 dark:bg-neutral-900 dark:hover:bg-neutral-800",
  /** Highlights the journey step that matches the current route. */
  stepPillCurrent:
    "border-[var(--al-accent-interactive)] bg-al-surface-raised text-al-text-primary ring-1 ring-[var(--al-accent-interactive)]/35",
  /** Highlights the suggested next step when the operator is not already on a journey route. */
  stepPillRecommended:
    "border-neutral-400 bg-al-surface-raised dark:border-neutral-500",
  optional: `${OPERATOR_TYPE_SCALE.helper} font-medium text-al-text-secondary underline decoration-al-text-secondary/40 underline-offset-2 hover:text-al-text-primary hover:decoration-[var(--al-accent-interactive)]`,
} as const;

/**
 * Form field caption — `<Label>` and `<legend>` on operator forms (TB-2111).
 * Never compose with {@link OPERATOR_TYPOGRAPHY.body}: it carries `font-normal`, which wins in Tailwind merge.
 */
export const OPERATOR_FORM_FIELD_LABEL_CLASS = "text-[13px] font-semibold leading-5 text-al-text-primary";

/** Semibold scan marker on inline guidance lines — pair with normal-weight body copy after the colon. */
export const INLINE_GUIDANCE_LABEL_CLASS = "font-semibold text-al-text-primary";

/** @deprecated Use {@link INLINE_GUIDANCE_LABEL_CLASS}. */
export const OPERATOR_GUIDANCE_NEXT_LABEL_CLASS = INLINE_GUIDANCE_LABEL_CLASS;

/**
 * Medium scan marker for inline metadata keys (`Label: value`) — quieter than guidance semibold.
 * Pair with normal-weight value text; do not use for instructional prefixes (use {@link INLINE_GUIDANCE_LABEL_CLASS}).
 */
export const INLINE_METADATA_LABEL_CLASS = "font-medium text-al-text-primary";

/** Helper-sized page/section leads — wider than max-w-prose so 12px one-line intros are not capped at ~65ch. */
export const OPERATOR_PAGE_LEAD_MEASURE = "max-w-3xl";

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
  tab: OPERATOR_TYPE_SCALE.tab,
  micro: OPERATOR_TYPE_SCALE.micro,
  /** Status chips (11px). Do not use arbitrary `text-[10px]` on operator surfaces. */
  badge: "text-[11px] font-medium leading-none",
  dataValue: `${OPERATOR_TYPE_SCALE.body} font-medium tabular-nums`,
  /** Dashboard / metric tiles only — not page titles. */
  kpiValue: "font-mono text-4xl font-semibold tabular-nums text-al-text-primary",
  /** Executive dashboard numbers (KPI tiles + ROI summary) — one treatment (BDA-139). */
  executiveDashboardMetric: "text-2xl font-semibold tabular-nums text-al-text-primary",
} as const;

/** Inverse tooltip surface — paired with `--al-tooltip-*` in `globals.css`; do not reuse page caption tokens inside tooltips. */
export const TOOLTIP_SURFACE = {
  content:
    "border border-[var(--al-tooltip-border)] bg-[var(--al-tooltip-bg)] text-[var(--al-tooltip-fg)] shadow-md",
} as const;

export const TOOLTIP_TYPOGRAPHY = {
  body: "text-[13px] font-normal leading-5 text-[var(--al-tooltip-fg)]",
  title: "text-[13px] font-semibold leading-5 text-[var(--al-tooltip-fg)]",
  muted: "text-xs font-normal leading-[18px] text-[var(--al-tooltip-fg-muted)]",
  link: "font-medium text-[var(--al-tooltip-link)] underline decoration-[var(--al-tooltip-link)]/60 underline-offset-2 hover:text-[var(--al-tooltip-link-hover)] hover:decoration-[var(--al-tooltip-link-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-tooltip-link)]",
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
      `inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2.5 py-1 ${OPERATOR_TYPOGRAPHY.badge} text-al-text-primary no-underline hover:bg-[var(--al-layer-hover)] dark:border-neutral-600`,
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
  body: OPERATOR_TYPOGRAPHY.body,
  /** Hero and pricing intros — slightly larger than operator body copy. */
  lead: "text-base leading-relaxed text-neutral-700 sm:text-lg dark:text-neutral-300",
  meta: OPERATOR_TYPOGRAPHY.helper,
  // teal-900 (≥4.5:1 on marketing hero bands); teal-800 fails axe on neutral-50.
  eyebrow: `${OPERATOR_TYPOGRAPHY.helper} font-semibold uppercase tracking-wide text-teal-900 dark:text-teal-200`,
  formLabel: `${OPERATOR_TYPE_SCALE.body} font-medium text-al-text-primary`,
} as const;

/** Motion-safe marketing entrance — pair with globals `.marketing-reveal-in`. */
export const MARKETING_MOTION = {
  revealIn: "marketing-reveal-in",
  heroVisual: "marketing-hero-visual",
} as const;

/** Executive buyer shell — reuses operator scale; eyebrow matches marketing entry surfaces. */
export const EXECUTIVE_TYPOGRAPHY = {
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

/** Primary marketing CTA — white on teal-800 meets WCAG 2.2 AA 4.5:1 at 14px (`text-sm`) in light and dark. */
export const MARKETING_PRIMARY_CTA_CLASS =
  "inline-flex rounded-md bg-teal-800 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-teal-900 dark:bg-teal-800 dark:hover:bg-teal-900";

/** Secondary caption on marketing/demo surfaces — passes 4.5:1 on `--al-surface-base` (avoid `text-neutral-500` at 11–12px). */
export const MARKETING_CAPTION_TEXT_CLASS = "text-neutral-600 dark:text-neutral-400";

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
  switch (kind) {
    case "ready":
      return `${STATUS_TAG_BASE} ${STATUS_TAG_SHAPE} border-l-emerald-600 bg-[var(--al-status-ready-bg)] text-[var(--al-status-ready-fg)] dark:border-l-emerald-500`;

    case "needs-attention":
      return `${STATUS_TAG_BASE} ${STATUS_TAG_SHAPE} border-l-amber-600 bg-[var(--al-status-warn-bg)] text-[var(--al-status-warn-fg)] dark:border-l-amber-500`;

    case "blocked":
      return `${STATUS_TAG_BASE} ${STATUS_TAG_SHAPE} border-l-rose-600 bg-[var(--al-status-blocked-bg)] text-[var(--al-status-blocked-fg)] dark:border-l-rose-500`;

    case "approved":
      return `${STATUS_TAG_BASE} ${STATUS_TAG_SHAPE} border-l-emerald-700 bg-[var(--al-status-approved-bg)] text-[var(--al-status-approved-fg)] dark:border-l-emerald-500`;

    case "approved-with-monitoring":
      return `${STATUS_TAG_BASE} ${STATUS_TAG_SHAPE} border-l-teal-700 bg-[var(--al-status-approved-monitoring-bg)] text-[var(--al-status-approved-monitoring-fg)] dark:border-l-teal-500`;

    case "in-progress":
      return `${STATUS_TAG_BASE} ${STATUS_TAG_SHAPE} border-l-sky-700 bg-sky-100 text-sky-950 dark:border-l-sky-500 dark:bg-sky-950/60 dark:text-sky-100`;

    case "draft":
      return `${STATUS_TAG_BASE} ${STATUS_TAG_SHAPE} border-l-neutral-500 bg-neutral-100 text-al-text-secondary dark:border-l-neutral-400 dark:bg-neutral-800/80`;

    case "neutral":
    default:
      return `${STATUS_TAG_BASE} ${STATUS_TAG_SHAPE} border-l-neutral-400 bg-neutral-100 text-al-text-secondary dark:border-l-neutral-500 dark:bg-neutral-800/80`;
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
      return `${STATUS_TAG_BASE} bg-neutral-500/8 text-al-text-secondary dark:bg-neutral-500/12`;

    default: {
      const exhaustive: never = kind;

      return exhaustive;
    }
  }
}
