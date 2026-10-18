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
      : "Captured time was not stored";
  const subscription = formatInfraEvidenceSubscriptionLabel(snapshot.subscriptionName, snapshot.subscriptionId);
  const parts: string[] = [];

  if (subscription != null) {
    parts.push(subscription);
  } else if (snapshot.subscriptionName == null && snapshot.subscriptionId == null) {
    parts.push("Subscription was not stored.");
  }

  if (snapshot.architectureName === null || snapshot.architectureName === undefined) {
    parts.push("Architecture name was not stored.");
  } else if (snapshot.architectureName.trim().length === 0) {
    parts.push("Architecture name was stored empty.");
  } else {
    parts.push(snapshot.architectureName.trim());
  }

  parts.push(captured);

  return parts.join(" · ");
}
