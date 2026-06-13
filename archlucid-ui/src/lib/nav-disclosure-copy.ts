/**
 * Progressive disclosure labels (sidebar + inline help). Tier model unchanged; copy only.
 * @see `docs/library/operator-shell.md`
 */
/** Sidebar collapsed-pilot expand control — intent over feature count. */
export const SIDEBAR_SHOW_ALL_FEATURES = {
  show: "Show governance & analysis tools",
  hide: "Fewer sidebar links",
  title: "Unlock governance workflow, compare, replay, and deeper analysis destinations.",
} as const;

export const SIDEBAR_QUICK_ACTIONS_LABEL = "Start review & audit";

export const NAV_DISCLOSURE = {
  extended: {
    /** Collapsed: reveal extended-tier links (analysis / investigation). */
    show: "Show analysis & investigation tools",
    /** Expanded: hide extended-tier links. */
    hide: "Hide analysis & investigation tools",
    /** `title` on the settings checkbox for extended-tier links. */
    title:
      "Compare reviews, replay authority chains, advisory scans, and similar investigation tools.",
  },
  /**
   * Maps to **`showAdvanced`** (localStorage `archlucid_nav_show_advanced`) together with Sidebar layout →
   * “Show governance, audit & admin controls”.
   */
  advancedOperationsSidebar: {
    show: "Show governance & audit tools",
    hide: "Hide governance & audit tools",
    /** Announced when collapsed (not the visible button text on small breakpoints). */
    assistiveCollapsed:
      "Adds governance workflow, alerts, and audit destinations to the sidebar when expanded.",
  },
  advanced: {
    /** Settings checkbox: reveal advanced Enterprise Controls links. */
    show: "Show governance, audit & admin controls",
    title:
      "Alert configuration, audit log, governance workflow, planning, and admin-level controls.",
  },
} as const;
