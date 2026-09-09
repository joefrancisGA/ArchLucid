import type { PageShortcutEntry } from "@/lib/shortcut-registry";

export const DRIFT_WORKBENCH_PAGE_SHORTCUTS: readonly PageShortcutEntry[] = [
  {
    key: "arrowdown",
    label: "Next drift row",
    description: "Move selection to the next drift change row in the table",
  },
  {
    key: "arrowup",
    label: "Previous drift row",
    description: "Move selection to the previous drift change row in the table",
  },
  {
    key: "escape",
    label: "Clear selection",
    description: "Close the change detail panel and clear the selected row",
  },
];
