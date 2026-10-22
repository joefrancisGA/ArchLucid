import type { PageShortcutEntry } from "@/lib/shortcut-registry";

export const REMEDIATION_FACTORY_PAGE_SHORTCUTS: readonly PageShortcutEntry[] = [
  {
    key: "alt+j",
    label: "Next ranked row",
    description: "Select the next row in the priority queue or ranked paths table",
  },
  {
    key: "alt+k",
    label: "Previous ranked row",
    description: "Select the previous row in the priority queue or ranked paths table",
  },
  {
    key: "alt+i",
    label: "Focus path inspect",
    description: "Move focus to the path inspect panel for the current selection",
  },
  {
    key: "alt+o",
    label: "Open evidence",
    description: "Move focus to the evidence link for the selected queue row when one is available",
  },
  {
    key: "alt+q",
    label: "Return to queue",
    description: "Move focus back to the selected queue row",
  },
  {
    key: "alt+e",
    label: "Explain selected score",
    description: "Run the priority score simulator for the selected finding",
  },
];

/** Ranked-path queue hints — exclude score explain (finding-only). */
export const REMEDIATION_FACTORY_QUEUE_NAVIGATION_SHORTCUTS: readonly PageShortcutEntry[] =
  REMEDIATION_FACTORY_PAGE_SHORTCUTS.filter((entry) => entry.key !== "alt+e");
