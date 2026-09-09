import type { ArchitectureInventoryBindingResponse } from "@/lib/api/architecture-inventory-binding-api";

/** AS-052 — bound snapshots this old (or older) are labeled stale. Warn only; never auto-collect. */
export const ARCHITECTURE_INVENTORY_SNAPSHOT_STALE_AFTER_DAYS = 7 as const;

export const ARCHITECTURE_INVENTORY_SNAPSHOT_STALE_AFTER_MS =
  ARCHITECTURE_INVENTORY_SNAPSHOT_STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;

export const ARCHITECTURE_INVENTORY_SNAPSHOT_FRESHNESS_CAREER_EXPORT_HEADING =
  "Inventory freshness" as const;

export const ARCHITECTURE_INVENTORY_SNAPSHOT_STALE_LINE_PREFIX = "Bound snapshot captured" as const;

export const ARCHITECTURE_INVENTORY_SNAPSHOT_STALE_LINE_SUFFIX =
  "— may not reflect current estate." as const;

export function isArchitectureInventorySnapshotStale(
  capturedUtc: string | Date | null | undefined,
  nowUtc: Date = new Date(),
): boolean {
  if (capturedUtc == null) {
    return false;
  }

  const capturedMs =
    typeof capturedUtc === "string" ? Date.parse(capturedUtc) : capturedUtc.getTime();

  if (Number.isNaN(capturedMs)) {
    return false;
  }

  return nowUtc.getTime() - capturedMs >= ARCHITECTURE_INVENTORY_SNAPSHOT_STALE_AFTER_MS;
}

export function formatArchitectureInventorySnapshotStaleLine(capturedUtc: string | Date): string {
  const captured = typeof capturedUtc === "string" ? new Date(capturedUtc) : capturedUtc;
  const year = captured.getUTCFullYear().toString().padStart(4, "0");
  const month = (captured.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = captured.getUTCDate().toString().padStart(2, "0");

  return `${ARCHITECTURE_INVENTORY_SNAPSHOT_STALE_LINE_PREFIX} ${year}-${month}-${day} ${ARCHITECTURE_INVENTORY_SNAPSHOT_STALE_LINE_SUFFIX}`;
}

export function formatArchitectureInventorySnapshotStaleLineIfStale(
  binding: ArchitectureInventoryBindingResponse | null | undefined,
  nowUtc: Date = new Date(),
): string | null {
  if (binding == null || binding.isBound !== true) {
    return null;
  }

  const capturedUtc = binding.snapshotCapturedUtc;

  if (capturedUtc == null || capturedUtc.trim().length === 0) {
    return null;
  }

  if (!isArchitectureInventorySnapshotStale(capturedUtc, nowUtc)) {
    return null;
  }

  return formatArchitectureInventorySnapshotStaleLine(capturedUtc);
}

export function formatArchitectureInventorySnapshotFreshnessCareerExportMarkdown(
  capturedUtc: string | Date | null | undefined,
  nowUtc: Date = new Date(),
): string {
  if (capturedUtc == null) {
    return "";
  }

  if (!isArchitectureInventorySnapshotStale(capturedUtc, nowUtc)) {
    return "";
  }

  return `## ${ARCHITECTURE_INVENTORY_SNAPSHOT_FRESHNESS_CAREER_EXPORT_HEADING}\n\n${formatArchitectureInventorySnapshotStaleLine(capturedUtc)}\n`;
}
