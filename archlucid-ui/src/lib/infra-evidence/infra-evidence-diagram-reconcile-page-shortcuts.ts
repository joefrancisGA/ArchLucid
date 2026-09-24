import type { PageShortcutEntry } from "@/lib/shortcut-registry";

export const DIAGRAM_RECONCILE_WORKBENCH_PAGE_SHORTCUTS: readonly PageShortcutEntry[] = [
  {
    key: "ctrl+enter",
    label: "Ingest diagram",
    description: "Ingest the Mermaid diagram on the sealed review record",
  },
  {
    key: "ctrl+shift+r",
    label: "Reconcile diagram",
    description: "Reconcile the ingested diagram against the selected inventory snapshot",
  },
  {
    key: "j",
    label: "Next correspondence row",
    description: "Move selection to the next correspondence row in the results table",
  },
  {
    key: "k",
    label: "Previous correspondence row",
    description: "Move selection to the previous correspondence row in the results table",
  },
];
