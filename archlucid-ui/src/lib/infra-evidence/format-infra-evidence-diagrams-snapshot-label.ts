import { DEFAULT_IANA_TIME_ZONE_ID } from "@/lib/default-iana-time-zone";
import { formatInstantInPreferredTimeZoneMilitary } from "@/lib/locale-datetime";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import {
  formatInfraEvidenceSnapshotResourceCountLabel,
  formatInfraEvidenceSubscriptionLabel,
} from "@/lib/infra-evidence/format-infra-evidence-snapshot-label";
import { isUuidLike } from "@/lib/resolve-governance-finding-resource-group";

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
  const subscriptionId = snapshot.subscriptionId?.trim() ?? "";
  const subscriptionName = snapshot.subscriptionName?.trim() ?? "";
  const parts: string[] = [];

  if (subscription === null) {
    parts.push("Subscription was not stored.");
  } else if (subscriptionName.length === 0 && isUuidLike(subscriptionId)) {
    // Omit raw subscription GUIDs from the diagrams picker label.
  } else {
    parts.push(subscription);
  }

  parts.push(captured);
  parts.push(formatInfraEvidenceSnapshotResourceCountLabel(snapshot.resourceCount));

  return parts.join(" · ");
}
