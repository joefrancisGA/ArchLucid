/**
 * Progressive disclosure labels (sidebar + inline help). Tier model unchanged; copy only.
 * @see `docs/library/customer-facing/WORKSPACE_NAVIGATION_GUIDE.md`
 */
/** Sidebar collapsed-pilot expand control — intent over feature count. */
export const SIDEBAR_SHOW_ALL_FEATURES = {
  show: "Show all sidebar links",
  hide: "Fewer sidebar links",
  title: "Show approval workflow, compare, replay, and deeper analysis links in the sidebar.",
} as const;

/**
 * Evaluator escape hatch: reveal sidebar links that stay hidden under progressive disclosure.
 * Default remains collapsed for first-run pilots; this control is the reveal-all affordance.
 */
export const SHOW_ALL_DESTINATIONS = {
  show: SIDEBAR_SHOW_ALL_FEATURES.show,
  hide: SIDEBAR_SHOW_ALL_FEATURES.hide,
  title: SIDEBAR_SHOW_ALL_FEATURES.title,
  lockedReasonAfterFinalize: "Available after your first finalized review",
} as const;

/**
 * V1: sidebar footer customization (expand-all toggle, layout dialog) is not surfaced.
 * Per-group "N more" disclosure and the command palette remain; infrastructure stays for V1.1+.
 */
export const V1_SIDEBAR_CUSTOMIZATION_VISIBLE = false;

export const SIDEBAR_QUICK_ACTIONS_LABEL = "Start review & audit";

/** Platform-admin sidebar section — workspace settings and operator tooling, not operate governance. */
export const SIDEBAR_ADMINISTRATION = {
  title: "Show or hide Settings and platform administration destinations in the sidebar.",
  ariaCollapsed: "Administration, collapsed",
  ariaExpanded: "Administration, expanded",
  assistiveShow: "Administration section hidden. Settings and recycle bin are not listed.",
  assistiveHide: "Administration section visible. Settings and platform admin links are listed below.",
} as const;

export const OPERATOR_ADVANCED_MODE = {
  /** Operate-layer disclosure — governance, audit, and alerting stay hidden until enabled. */
  show: "Enable advanced features",
  hide: "Hide advanced features",
  title:
    "Show approval workflow, alerts, audit trail, and policy packs in the sidebar.",
  assistiveOn: "Advanced features on. Policy, audit, and alerting destinations are visible.",
  assistiveOff:
    "Advanced features off. Core Pilot review destinations stay visible until you enable policy tooling.",
  footnote:
    "Policy, audit, and alerting stay hidden until you turn this on — default for new workspaces.",
} as const;

export const NAV_DISCLOSURE = {
  extended: {
    /** Collapsed: reveal extended-tier links (analysis / investigation). */
    show: "Show analysis & investigation tools",
    /** Expanded: hide extended-tier links. */
    hide: "Hide analysis & investigation tools",
    /** `title` on the settings checkbox for extended-tier links. */
    title:
      "Compare two reviews, replay authority chains, advisory scans, and similar investigation tools.",
  },
  /**
   * Maps to **`showAdvanced`** (localStorage `archlucid_nav_show_advanced`) together with Sidebar layout →
   * “Show audit & admin controls”.
   */
  advancedOperationsSidebar: {
    show: "Show policy & audit tools",
    hide: "Hide policy & audit tools",
    /** Announced when collapsed (not the visible button text on small breakpoints). */
    assistiveCollapsed:
      "Adds approval workflow, alerts, and audit destinations to the sidebar when expanded.",
  },
  advanced: {
    /** Settings checkbox: reveal advanced Enterprise Controls links. */
    show: "Show policy, audit & admin controls",
    title:
      "Alert configuration, audit trail, approval workflow, planning, and admin-level controls.",
  },
} as const;
