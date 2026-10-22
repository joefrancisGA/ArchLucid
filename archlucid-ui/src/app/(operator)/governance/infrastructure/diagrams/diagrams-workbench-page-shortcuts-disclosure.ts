import type { PageShortcutEntry } from "@/components/usability/PageShortcutsDisclosure";

export function diagramsWorkbenchPageShortcutsDisclosureEntries(): readonly PageShortcutEntry[] {
  return [
    {
      id: "subscription-picker",
      label: "Alt+1",
      description: "Focus subscription picker",
    },
    {
      id: "snapshot-picker",
      label: "Alt+2",
      description: "Focus snapshot picker",
    },
    {
      id: "diagram-type-picker",
      label: "Alt+3",
      description: "Focus diagram type picker",
    },
  ];
}
