import { isInfraEvidenceSnapshotCaptureSucceeded } from "@/lib/infra-evidence/infra-evidence-snapshot-capture-status";
import type { SecurityEvidencePathAttackPathReport } from "@/lib/security-evidence-path-types";

export type SecureNowCapturePathDelta = {
  readonly added: readonly string[];
  readonly gone: readonly string[];
  readonly unchanged: readonly string[];
};

/** Successful inventory captures only — not partial, failed, or pending rows. */
export function isSecureNowCapturePathDeltaEligibleSnapshot(
  captureStatus: number | string | null | undefined,
): boolean {
  return isInfraEvidenceSnapshotCaptureSucceeded(captureStatus);
}

export function collectSecurityEvidencePathIdsFromAttackPathReport(
  report: SecurityEvidencePathAttackPathReport | null | undefined,
): readonly string[] {
  if (report == null) {
    return [];
  }

  const ids = new Set<string>();

  for (const path of report.vulnerableAttackPaths) {
    const pathId = path.pathId.trim();

    if (pathId.length > 0) {
      ids.add(pathId);
    }
  }

  for (const group of report.unevaluatedGroups) {
    for (const pathIdRaw of group.pathIds) {
      const pathId = pathIdRaw.trim();

      if (pathId.length > 0) {
        ids.add(pathId);
      }
    }
  }

  return [...ids].sort((left, right) => left.localeCompare(right));
}

export function computeSecureNowCapturePathDelta(
  previousPathIds: readonly string[],
  latestPathIds: readonly string[],
): SecureNowCapturePathDelta {
  const previous = new Set(previousPathIds.map((id) => id.trim()).filter((id) => id.length > 0));
  const latest = new Set(latestPathIds.map((id) => id.trim()).filter((id) => id.length > 0));

  const added = [...latest].filter((id) => !previous.has(id)).sort((a, b) => a.localeCompare(b));
  const gone = [...previous].filter((id) => !latest.has(id)).sort((a, b) => a.localeCompare(b));
  const unchanged = [...latest].filter((id) => previous.has(id)).sort((a, b) => a.localeCompare(b));

  return { added, gone, unchanged };
}

export function formatSecureNowCapturePathDeltaList(pathIds: readonly string[]): string {
  return pathIds.length === 0 ? "None" : pathIds.join(", ");
}
