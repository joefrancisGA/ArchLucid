import type { PageShortcutEntry } from "@/lib/shortcut-registry";

export const DIAGRAMS_WORKBENCH_PAGE_SHORTCUTS: readonly PageShortcutEntry[] = [
  {
    key: "alt+1",
    label: "Focus subscription picker (Alt+1)",
    description: "Focus the subscription filter on the diagrams workbench",
  },
  {
    key: "alt+2",
    label: "Focus snapshot picker (Alt+2)",
    description: "Focus the inventory snapshot picker on the diagrams workbench",
  },
  {
    key: "alt+3",
    label: "Focus diagram type picker (Alt+3)",
    description: "Focus the diagram type picker on the diagrams workbench",
  },
];
