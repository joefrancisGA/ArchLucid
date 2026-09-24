import type { PageShortcutEntry } from "@/lib/shortcut-registry";

export const DRIFT_WORKBENCH_PAGE_SHORTCUTS: readonly PageShortcutEntry[] = [
  {
    key: "arrowdown-snapshots",
    label: "Next snapshot row",
    description: "Move focus to the next inventory snapshot row in the table",
  },
  {
    key: "arrowup-snapshots",
    label: "Previous snapshot row",
    description: "Move focus to the previous inventory snapshot row in the table",
  },
  {
    key: "enter-snapshots",
    label: "Select snapshot row",
    description: "Select the focused inventory snapshot row",
  },
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
