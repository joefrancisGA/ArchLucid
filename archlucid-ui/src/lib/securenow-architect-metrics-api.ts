import { proxyJsonGet } from "@/lib/proxy-json-client";
import type { SecureNowArchitectOutcomeMetrics } from "@/lib/securenow-architect-metrics-types";

const ARCHITECT_METRICS_PATH = "/api/proxy/v1/operational-security/architect-metrics";

function finiteNumberOrZero(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function fetchSecureNowArchitectOutcomeMetrics(
  fromSnapshotId: string,
  toSnapshotId: string,
): Promise<SecureNowArchitectOutcomeMetrics | null> {
  const params = new URLSearchParams({
    fromSnapshotId: fromSnapshotId.trim(),
    toSnapshotId: toSnapshotId.trim(),
  });
  const raw = await proxyJsonGet<Record<string, unknown>>(`${ARCHITECT_METRICS_PATH}?${params.toString()}`);

  const fromId = (typeof raw.fromSnapshotId === "string" ? raw.fromSnapshotId : fromSnapshotId).trim();
  const toId = (typeof raw.toSnapshotId === "string" ? raw.toSnapshotId : toSnapshotId).trim();

  if (fromId.length === 0 || toId.length === 0) {
    return null;
  }

  const supportingRaw = raw.supportingOperationalMetrics as Record<string, unknown> | null | undefined;

  return {
    fromSnapshotId: fromId,
    toSnapshotId: toId,
    ruleVersion: String(raw.ruleVersion ?? ""),
    criticalOrHighConfidencePathsRemoved: finiteNumberOrZero(raw.criticalOrHighConfidencePathsRemoved),
    privilegedIdentityNodesOnPathsReduced: finiteNumberOrZero(raw.privilegedIdentityNodesOnPathsReduced),
    unrestrictedEgressCapabilityPathsReduced: finiteNumberOrZero(raw.unrestrictedEgressCapabilityPathsReduced),
    assertedCrownJewelExposurePathsRemoved: finiteNumberOrZero(raw.assertedCrownJewelExposurePathsRemoved),
    sharedControlBlastRadiusPathsRemoved: finiteNumberOrZero(raw.sharedControlBlastRadiusPathsRemoved),
    exceptionsExpired: finiteNumberOrZero(raw.exceptionsExpired),
    remediationRecurrenceCount: finiteNumberOrZero(raw.remediationRecurrenceCount),
    supportingOperationalMetrics:
      supportingRaw == null
        ? null
        : {
            openFindings: finiteNumberOrZero(supportingRaw.openFindings),
          },
  };
}
