import type { ProvenanceViewMode } from "@/components/provenance/ProvenanceViewModeSwitcher";
import {
  PROVENANCE_VIEW_GRAPH_LABEL,
  PROVENANCE_VIEW_TABLES_LABEL,
  PROVENANCE_VIEW_TIMELINE_LABEL,
} from "@/lib/provenance-evidence-copy";

export const PROVENANCE_PAGE_WORKSPACE_VIEW_MODE_OPTIONS: ReadonlyArray<{
  id: ProvenanceViewMode;
  label: string;
}> = [
  { id: "graph", label: PROVENANCE_VIEW_GRAPH_LABEL },
  { id: "timeline", label: PROVENANCE_VIEW_TIMELINE_LABEL },
  { id: "table", label: PROVENANCE_VIEW_TABLES_LABEL },
];

export function formatProvenancePageWorkspaceUtc(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}
