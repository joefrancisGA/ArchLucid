import type { PageShortcutEntry } from "@/components/usability/PageShortcutsDisclosure";

export const EXTRACT_UPLOAD_PAGE_SHORTCUTS: readonly PageShortcutEntry[] = [
  {
    id: "focus",
    label: "Focus upload (Ctrl+U)",
    description: "Focus the inventory upload surface or open Replace inventory on Extract & upload",
  },
  {
    id: "copy",
    label: "Copy quick-start command (Ctrl+Shift+C)",
    description: "Copy the quick-start packager command for the selected cloud provider",
  },
];
