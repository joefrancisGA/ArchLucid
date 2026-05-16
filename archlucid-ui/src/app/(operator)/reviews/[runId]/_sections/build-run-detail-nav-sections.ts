import type { RunDetailSection } from "@/components/RunDetailSectionNav";
import type { ManifestSummary, RunDetail } from "@/types/authority";

export type BuildRunDetailNavSectionsArgs = {
  readonly buyerPolishedSections: boolean;
  readonly manifestSummary: ManifestSummary | null;
  readonly trustEvidenceCard: RunDetail["trustEvidenceCard"];
  readonly manifestId: string | null | undefined;
  readonly graphSnapshotId: string | null | undefined;
};

/** Section strip anchors for buyer-polished vs full-operator run detail layouts. */
export function buildRunDetailNavSections(
  args: BuildRunDetailNavSectionsArgs,
): RunDetailSection[] {
  const { buyerPolishedSections, manifestSummary, trustEvidenceCard, manifestId, graphSnapshotId } =
    args;

    if (buyerPolishedSections) {
      return [
        { id: "manifest-summary", label: "Outcome", available: Boolean(manifestSummary) },
        { id: "capture-evidence", label: "Capture evidence", available: !Boolean(manifestId) },
        { id: "trust-evidence", label: "Evidence", available: Boolean(trustEvidenceCard) },
        { id: "run-explanation", label: "Assessment", available: Boolean(manifestId) },
        { id: "pipeline-timeline", label: "Activity", available: true },
        {
          id: "architecture-graph",
          label: "Evidence graph",
          available: Boolean(graphSnapshotId),
        },
        { id: "artifacts-exports", label: "Deliverables", available: Boolean(manifestId) },
      ];
    }
  
    return [
      { id: "manifest-summary", label: "Manifest", available: Boolean(manifestSummary) },
      { id: "capture-evidence", label: "Add evidence", available: !Boolean(manifestId) },
      { id: "trust-evidence", label: "Evidence card", available: Boolean(trustEvidenceCard) },
    { id: "run-metadata", label: "Review", available: true },
    { id: "pipeline-timeline", label: "Timeline", available: true },
    {
      id: "architecture-graph",
      label: "Architecture graph",
      available: Boolean(graphSnapshotId),
    },
    { id: "authority-chain", label: "Review trail", available: true },
    { id: "artifacts-exports", label: "Artifacts", available: Boolean(manifestId) },
    { id: "run-explanation", label: "Explanation", available: Boolean(manifestId) },
    { id: "agent-forensics", label: "Diagnostics", available: true },
    { id: "run-actions", label: "Actions", available: true },
  ];
}
