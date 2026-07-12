import type { components } from "@/lib/api-types.generated";

import type { ApiKeyAuditEvent, ApiKeysSummaryMetrics } from "./api-keys-settings-types";

type AdminApiKeySettingsResponse = components["schemas"]["AdminApiKeySettingsResponse"];
type ApiKeySlotStatusDto = components["schemas"]["ApiKeySlotStatusDto"];

function countActiveKeys(slot: ApiKeySlotStatusDto | undefined): number {
  if (slot?.isConfigured !== true) {
    return 0;
  }

  const segmentCount = slot.maskedSegments?.length ?? 0;

  if (segmentCount > 0) {
    return segmentCount;
  }

  return 1;
}

function latestRotationUtc(events: readonly ApiKeyAuditEvent[]): string | null {
  const rotationEvents = events.filter(
    (event) =>
      event.outcome === "success"
      && (event.action === "key_rotated" || event.action === "overlap_key_issued" || event.action === "key_created"),
  );

  if (rotationEvents.length === 0) {
    return null;
  }

  return rotationEvents[0]?.occurredAtUtc ?? null;
}

export function buildApiKeysSummary(
  settings: AdminApiKeySettingsResponse,
  events: readonly ApiKeyAuditEvent[],
): ApiKeysSummaryMetrics {
  return {
    accessEnabled: settings.enabled === true,
    activeAdminKeys: countActiveKeys(settings.admin),
    activeReadOnlyKeys: countActiveKeys(settings.readOnly),
    lastRotationUtc: latestRotationUtc(events),
    lastUsedUtc: null,
  };
}
