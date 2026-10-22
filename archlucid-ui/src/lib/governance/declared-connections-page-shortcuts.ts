import type { PageShortcutEntry } from "@/lib/shortcut-registry";

export const DECLARED_CONNECTIONS_SAVE_SHORTCUT = "ctrl+enter" as const;

export const DECLARED_CONNECTIONS_FOCUS_FROM_SHORTCUT = "alt+f" as const;

export const DECLARED_CONNECTIONS_PAGE_SHORTCUTS: readonly PageShortcutEntry[] = [
  {
    key: DECLARED_CONNECTIONS_SAVE_SHORTCUT,
    label: "Save declared connection",
    description: "Save the draft when validation passes",
  },
  {
    key: DECLARED_CONNECTIONS_FOCUS_FROM_SHORTCUT,
    label: "Focus From resource ID",
    description: "Move focus to the From cloud resource ID field",
  },
];
