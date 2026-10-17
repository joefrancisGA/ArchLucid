import type { PageShortcutEntry } from "@/lib/shortcut-registry";

export const GOVERNANCE_FINDINGS_QUEUE_PATH_INSPECT_PAGE_SHORTCUTS: readonly PageShortcutEntry[] = [
  {
    key: "alt+i",
    label: "Focus path inspect",
    description: "Move focus to the path inspect panel for the current findings queue selection",
  },
];
