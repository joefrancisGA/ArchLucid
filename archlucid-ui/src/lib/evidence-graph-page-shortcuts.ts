import type { PageShortcutEntry } from "@/components/usability/PageShortcutsDisclosure";

export const EVIDENCE_GRAPH_PAGE_SHORTCUTS: readonly PageShortcutEntry[] = [
  {
    id: "zoom",
    label: "Scroll / pinch",
    description: "Zoom the graph canvas in or out.",
  },
  {
    id: "pan",
    label: "Drag canvas",
    description: "Pan when the graph is zoomed.",
  },
  {
    id: "neighborhood",
    label: "Neighborhood mode",
    description: "Pick Node neighborhood in mode controls to focus one node and its connections.",
  },
];
