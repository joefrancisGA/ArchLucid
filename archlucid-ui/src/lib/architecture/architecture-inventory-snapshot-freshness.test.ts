import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_INVENTORY_SNAPSHOT_STALE_AFTER_HOURS,
  formatArchitectureInventoryBoundFreshnessLine,
  formatArchitectureInventoryBoundStaleWarning,
  resolveArchitectureInventorySnapshotFreshnessBand,
} from "@/lib/architecture/architecture-inventory-snapshot-freshness";

describe("architecture-inventory-snapshot-freshness (AS-052)", () => {
  const now = new Date("2026-07-19T12:00:00.000Z");

  it("documents a stale threshold constant", () => {
    expect(ARCHITECTURE_INVENTORY_SNAPSHOT_STALE_AFTER_HOURS).toBe(24);
  });

  it("labels snapshots within the threshold as current", () => {
    expect(
      resolveArchitectureInventorySnapshotFreshnessBand("2026-07-19T08:00:00.000Z", now),
    ).toBe("current");
    expect(
      formatArchitectureInventoryBoundFreshnessLine("2026-07-19T08:00:00.000Z", now),
    ).toBe("Snapshot age: 4 hours ago");
  });

  it("warns when the bound snapshot is older than the threshold", () => {
    const capturedUtc = "2026-07-17T12:00:00.000Z";

    expect(resolveArchitectureInventorySnapshotFreshnessBand(capturedUtc, now)).toBe("stale");
    expect(formatArchitectureInventoryBoundStaleWarning(capturedUtc, now)).toContain(
      "may not reflect current estate",
    );
    expect(formatArchitectureInventoryBoundFreshnessLine(capturedUtc, now)).toContain(
      "Bound snapshot captured",
    );
  });
});
