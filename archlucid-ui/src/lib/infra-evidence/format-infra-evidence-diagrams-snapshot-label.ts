import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { formatIsoUtcForDisplay } from "@/lib/format-iso-utc";
import { formatInfraEvidenceSubscriptionLabel } from "@/lib/infra-evidence/format-infra-evidence-snapshot-label";

/** Zone-explicit UTC capture label for diagrams snapshot picker options. */
export function formatInfraEvidenceDiagramsSnapshotPickerLabel(snapshot: InfraEvidenceSnapshotSummary): string {
  const captured =
    snapshot.capturedUtc != null && snapshot.capturedUtc.trim().length > 0
      ? formatIsoUtcForDisplay(snapshot.capturedUtc)
      : "unknown capture time (UTC)";
  const subscription = formatInfraEvidenceSubscriptionLabel(snapshot.subscriptionName, snapshot.subscriptionId);
  const parts: string[] = [];

  if (subscription != null) {
    parts.push(subscription);
  }

  parts.push(`captured ${captured}`);
  parts.push(`${snapshot.resourceCount} resources`);

  return parts.join(" · ");
}
