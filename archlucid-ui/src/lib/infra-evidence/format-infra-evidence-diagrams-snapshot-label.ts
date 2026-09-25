import { DEFAULT_IANA_TIME_ZONE_ID } from "@/lib/default-iana-time-zone";
import { formatInstantInPreferredTimeZoneMilitary } from "@/lib/locale-datetime";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { formatInfraEvidenceSubscriptionLabel } from "@/lib/infra-evidence/format-infra-evidence-snapshot-label";

/** Capture label for diagrams snapshot picker options in the operator's preferred zone. */
export function formatInfraEvidenceDiagramsSnapshotPickerLabel(
  snapshot: InfraEvidenceSnapshotSummary,
  ianaTimeZoneId: string = DEFAULT_IANA_TIME_ZONE_ID,
): string {
  const captured =
    snapshot.capturedUtc != null && snapshot.capturedUtc.trim().length > 0
      ? formatInstantInPreferredTimeZoneMilitary(snapshot.capturedUtc, ianaTimeZoneId)
      : "unknown capture time";
  const subscription = formatInfraEvidenceSubscriptionLabel(snapshot.subscriptionName, snapshot.subscriptionId);
  const parts: string[] = [];

  if (subscription != null) {
    parts.push(subscription);
  }

  parts.push(captured);
  parts.push(`${snapshot.resourceCount} resources`);

  return parts.join(" · ");
}
