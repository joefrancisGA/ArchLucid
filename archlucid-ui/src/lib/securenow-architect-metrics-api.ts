import { proxyJsonGet } from "@/lib/proxy-json-client";
import type { SecureNowArchitectOutcomeMetrics } from "@/lib/securenow-architect-metrics-types";

const ARCHITECT_METRICS_PATH = "/api/proxy/v1/operational-security/architect-metrics";

export async function fetchSecureNowArchitectOutcomeMetrics(
  fromSnapshotId: string,
  toSnapshotId: string,
): Promise<SecureNowArchitectOutcomeMetrics | null> {
  const params = new URLSearchParams({
    fromSnapshotId: fromSnapshotId.trim(),
    toSnapshotId: toSnapshotId.trim(),
  });
  const raw = await proxyJsonGet<Record<string, unknown>>(`${ARCHITECT_METRICS_PATH}?${params.toString()}`);

  const fromId = String(raw.fromSnapshotId ?? fromSnapshotId).trim();
  const toId = String(raw.toSnapshotId ?? toSnapshotId).trim();

  if (fromId.length === 0 || toId.length === 0) {
    return null;
  }

  const supportingRaw = raw.supportingOperationalMetrics as Record<string, unknown> | null | undefined;

  return {
    fromSnapshotId: fromId,
    toSnapshotId: toId,
    ruleVersion: String(raw.ruleVersion ?? ""),
    criticalOrHighConfidencePathsRemoved: Number(raw.criticalOrHighConfidencePathsRemoved ?? 0),
    privilegedIdentityNodesOnPathsReduced: Number(raw.privilegedIdentityNodesOnPathsReduced ?? 0),
    unrestrictedEgressCapabilityPathsReduced: Number(raw.unrestrictedEgressCapabilityPathsReduced ?? 0),
    assertedCrownJewelExposurePathsRemoved: Number(raw.assertedCrownJewelExposurePathsRemoved ?? 0),
    sharedControlBlastRadiusPathsRemoved: Number(raw.sharedControlBlastRadiusPathsRemoved ?? 0),
    exceptionsExpired: Number(raw.exceptionsExpired ?? 0),
    remediationRecurrenceCount: Number(raw.remediationRecurrenceCount ?? 0),
    supportingOperationalMetrics:
      supportingRaw == null
        ? null
        : {
            openFindings: Number(supportingRaw.openFindings ?? 0),
          },
  };
}
