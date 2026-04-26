/**
 * Progressive disclosure labels (sidebar + inline help). Tier model unchanged; copy only.
 * @see `docs/library/operator-shell.md`
 */
export const NAV_DISCLOSURE = {
  extended: {
    /** Collapsed: reveal extended-tier links (analysis / investigation). */
    show: "Show extended navigation",
    /** Expanded: hide extended-tier links. */
    hide: "Hide extended navigation",
    /** `title` on the sidebar toggle and settings checkbox. */
    title:
      "Compare runs, replay authority chains, advisory scans, and similar investigation tools.",
  },
  advanced: {
    /** Settings checkbox: reveal advanced Enterprise Controls links. */
    show: "Show governance, audit & admin controls",
    title:
      "Alert configuration, audit log, governance workflow, planning, and admin-level controls.",
  },
} as const;
