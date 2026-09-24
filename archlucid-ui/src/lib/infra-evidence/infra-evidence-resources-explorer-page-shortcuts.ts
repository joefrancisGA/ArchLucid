import type { PageShortcutEntry } from "@/lib/shortcut-registry";

export const RESOURCES_EXPLORER_PAGE_SHORTCUTS: readonly PageShortcutEntry[] = [
  {
    key: "enter",
    label: "Apply filters",
    description: "Submit the resource explorer filter form when a filter field has focus",
  },
  {
    key: "escape",
    label: "Clear ARM id disclosure",
    description: "Collapse the expanded resource ARM identifier row disclosure",
  },
];
