import type { PageShortcutEntry } from "@/lib/shortcut-registry";

export const REMEDIATION_WORKBENCH_PAGE_SHORTCUTS: readonly PageShortcutEntry[] = [
  {
    key: "j",
    label: "Next lifecycle card",
    description: "Move selection to the next remediation instance on the lifecycle board",
  },
  {
    key: "k",
    label: "Previous lifecycle card",
    description: "Move selection to the previous remediation instance on the lifecycle board",
  },
  {
    key: "arrowdown",
    label: "Next lifecycle card",
    description: "Move selection to the next remediation instance on the lifecycle board",
  },
  {
    key: "arrowup",
    label: "Previous lifecycle card",
    description: "Move selection to the previous remediation instance on the lifecycle board",
  },
];
