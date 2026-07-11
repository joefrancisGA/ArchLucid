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
        { id: "review-summary", label: "Summary", available: true },
        { id: "run-explanation", label: "Findings", available: true },
        { id: "trust-evidence", label: "Evidence", available: Boolean(trustEvidenceCard) },
        { id: "manifest-summary", label: "Policies and standards", available: Boolean(manifestId) },
        { id: "governance-decision", label: "Decisions", available: true },
        { id: "recommended-actions", label: "Remediation", available: true },
        { id: "review-package", label: "Review package", available: true },
        { id: "pipeline-timeline", label: "Activity and audit", available: true },
        {
          id: "architecture-graph",
          label: "Evidence trail",
          available: Boolean(graphSnapshotId),
        },
        { id: "artifacts-exports", label: "Deliverables", available: Boolean(manifestId) },
        { id: "submitted-architecture", label: "Submitted architecture", available: true },
      ];
    }
  
    return [
      { id: "review-summary", label: "Summary", available: true },
      { id: "run-explanation", label: "Findings", available: true },
      { id: "trust-evidence", label: "Evidence", available: Boolean(trustEvidenceCard) },
      { id: "manifest-summary", label: "Policies and standards", available: Boolean(manifestSummary) },
      { id: "governance-decision", label: "Decisions", available: true },
      { id: "recommended-actions", label: "Remediation", available: true },
      { id: "review-package", label: "Review package", available: true },
      { id: "capture-evidence", label: "Add evidence", available: !Boolean(manifestId) },
      { id: "technology-baseline", label: "Technology baseline", available: true },
      { id: "pipeline-timeline", label: "Activity and audit", available: true },
      {
        id: "architecture-graph",
        label: "Architecture graph",
        available: Boolean(graphSnapshotId),
      },
      { id: "authority-chain", label: "Review trail", available: true },
      { id: "artifacts-exports", label: "Artifacts", available: Boolean(manifestId) },
      { id: "submitted-architecture", label: "Submitted architecture", available: true },
      { id: "agent-forensics", label: "Diagnostics", available: true },
      { id: "run-actions", label: "Actions", available: true },
    ];
}
