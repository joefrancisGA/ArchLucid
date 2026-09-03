/**
 * Operator shell layout tokens — spacing, page containers, and shell chrome geometry.
 * @see docs/library/UI_DESIGN_SYSTEM.md
 */

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
  lifecycleEmphasized: "border-l-4 border-l-neutral-700 dark:border-l-neutral-400",
  /** Grouped examples / learning resources below workspace activity. */
  learningResourcesSurface:
    "rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/50",
} as const;

/** Neutral resume / continue-last-viewed strips (TB-2092 operator sweep). */
export const OPERATOR_RESUME = {
  strip: "rounded-lg border border-neutral-200 bg-neutral-50/80 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/40",
  stripSpaced: "mb-4 rounded-lg border border-neutral-200 bg-neutral-50/80 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/40",
  stripCompact: "mb-1 rounded-lg border border-neutral-200 bg-neutral-50/80 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/40",
  stripCelebrate: "mb-3 rounded-lg border border-neutral-200 bg-neutral-50/80 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/40",
  stripPadded: "rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40",
} as const;

/** Neutral selected-tile emphasis for pickers and wizards (TB-2092 operator sweep). */
export const OPERATOR_SELECTION = {
  tile:
    "border-neutral-500 bg-al-surface-raised ring-1 ring-neutral-400 dark:border-neutral-500 dark:ring-neutral-500",
  row: "border-neutral-500 bg-al-surface-raised dark:border-neutral-500",
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
export type OperatorPageContainerVariant = "full" | "workflow" | "dashboard" | "reading" | "settings";

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
    /** Administration settings and identity surfaces (~992px) — SCIM, SSO, account security rail. */
    settings: "w-full max-w-[62rem]",
  },
} as const;

/** Max shell width shared by operator top bar, sidebar row, and footer. */
export const OPERATOR_SHELL_MAX_WIDTH_CLASS = "w-full max-w-[1600px]";

/** Shared height for compact top-bar controls (scope switcher, help, account menu). */
export const OPERATOR_SHELL_TOOLBAR_CONTROL_CLASS = "h-8";

/** Inventory hub toolbars — align search/select height with adjacent filter chips. */
export const OPERATOR_INVENTORY_TOOLBAR_SEARCH_CLASS = OPERATOR_SHELL_TOOLBAR_CONTROL_CLASS;

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
 * Vertical rhythm inside one form field stack (label → control → helper). TB-2000.
 * Coexists with compact page chrome (Done TB-118) — do not use page-scale `space-y-8` here.
 */
export const OPERATOR_FORM_FIELD_STACK_CLASS = "space-y-3";

/**
 * Checkbox / radio row with a wrapping description — minimum gap before multi-line body copy. TB-2000.
 */
export const OPERATOR_FORM_CONTROL_DESCRIPTION_GAP_CLASS = "gap-3";

/** Short operator page leads and dashboard intros — full work-surface width (TB-2038). Do not cap at prose measure. */
export const OPERATOR_SHORT_HELPER_MEASURE_CLASS = "max-w-none";

/** @deprecated Prefer {@link OPERATOR_SHORT_HELPER_MEASURE_CLASS} on operator dashboards; reserve measure for long reading bodies. */
export const OPERATOR_PAGE_LEAD_MEASURE = "max-w-3xl";
