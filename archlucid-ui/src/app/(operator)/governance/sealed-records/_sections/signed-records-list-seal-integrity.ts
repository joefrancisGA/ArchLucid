import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { isManifestCommittedForPilotScorecardPackage } from "@/lib/pilot-scorecard-package-eligibility";
import type { ManifestSummary } from "@/types/authority";

export type SignedRecordsListSealIntegrityPresentation = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

/** Short digest for seal-integrity disclosure — full hash stays on the detail route. */
export function truncateSignedRecordsListSealDigest(manifestHash: string): string {
  const trimmed = manifestHash.trim();

  if (trimmed.length === 0) {
    return "—";
  }

  if (trimmed.length <= 16) {
    return trimmed;
  }

  return `${trimmed.slice(0, 8)}…${trimmed.slice(-8)}`;
}

/** Maps golden manifest summary fields to list-row seal integrity presentation. */
export function deriveSignedRecordsListSealIntegrity(
  summary: ManifestSummary,
): SignedRecordsListSealIntegrityPresentation {
  const hasHash = summary.manifestHash.trim().length > 0;

  if (!isManifestCommittedForPilotScorecardPackage(summary) || !hasHash) {
    return { kind: "needs-attention", label: "Needs attention" };
  }

  if (summary.unresolvedIssueCount > 0 || summary.hasUnresolvedIssues === true) {
    return { kind: "needs-attention", label: "Needs attention" };
  }

  if (summary.hasWarnings === true || summary.warningCount > 0) {
    return { kind: "approved-with-monitoring", label: "Sealed with warnings" };
  }

  return { kind: "ready", label: "Sealed" };
}
