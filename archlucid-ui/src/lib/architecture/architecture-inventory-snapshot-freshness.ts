import { formatInfraEvidenceSnapshotCapturedLabel } from "@/lib/infra-evidence/format-infra-evidence-snapshot-label";

/**
 * AS-052: bound inventory snapshots older than this are labeled stale on the architecture desk.
 * Warn only — does not trigger collection (IE plane owns capture).
 */
export const ARCHITECTURE_INVENTORY_SNAPSHOT_STALE_AFTER_HOURS = 24;

export type ArchitectureInventorySnapshotFreshnessBand = "current" | "stale" | "unknown";

export function resolveArchitectureInventorySnapshotAgeHours(
  capturedUtc: string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (capturedUtc == null || capturedUtc.trim().length === 0) {
    return null;
  }

  const capturedMs = Date.parse(capturedUtc);

  if (!Number.isFinite(capturedMs)) {
    return null;
  }

  const ageMs = now.getTime() - capturedMs;

  if (ageMs < 0) {
    return 0;
  }

  return ageMs / (60 * 60 * 1000);
}

export function resolveArchitectureInventorySnapshotFreshnessBand(
  capturedUtc: string | null | undefined,
  now: Date = new Date(),
): ArchitectureInventorySnapshotFreshnessBand {
  const ageHours = resolveArchitectureInventorySnapshotAgeHours(capturedUtc, now);

  if (ageHours === null) {
    return "unknown";
  }

  if (ageHours > ARCHITECTURE_INVENTORY_SNAPSHOT_STALE_AFTER_HOURS) {
    return "stale";
  }

  return "current";
}

export function formatArchitectureInventorySnapshotAgeLabel(
  capturedUtc: string | null | undefined,
  now: Date = new Date(),
): string | null {
  const ageHours = resolveArchitectureInventorySnapshotAgeHours(capturedUtc, now);

  if (ageHours === null) {
    return null;
  }

  if (ageHours < 1) {
    const ageMinutes = Math.max(1, Math.round(ageHours * 60));

    return `${ageMinutes} minute${ageMinutes === 1 ? "" : "s"} ago`;
  }

  if (ageHours < 48) {
    const roundedHours = Math.max(1, Math.round(ageHours));

    return `${roundedHours} hour${roundedHours === 1 ? "" : "s"} ago`;
  }

  const roundedDays = Math.max(1, Math.round(ageHours / 24));

  return `${roundedDays} day${roundedDays === 1 ? "" : "s"} ago`;
}

export function formatArchitectureInventoryBoundStaleWarning(
  capturedUtc: string | null | undefined,
  now: Date = new Date(),
): string | null {
  if (resolveArchitectureInventorySnapshotFreshnessBand(capturedUtc, now) !== "stale") {
    return null;
  }

  const capturedLabel = formatInfraEvidenceSnapshotCapturedLabel(capturedUtc);

  return `Bound snapshot captured ${capturedLabel} — may not reflect current estate.`;
}

export function formatArchitectureInventoryBoundFreshnessLine(
  capturedUtc: string | null | undefined,
  now: Date = new Date(),
): string | null {
  const band = resolveArchitectureInventorySnapshotFreshnessBand(capturedUtc, now);

  if (band === "stale") {
    return formatArchitectureInventoryBoundStaleWarning(capturedUtc, now);
  }

  const ageLabel = formatArchitectureInventorySnapshotAgeLabel(capturedUtc, now);

  if (ageLabel === null) {
    return null;
  }

  return `Snapshot age: ${ageLabel}`;
}
