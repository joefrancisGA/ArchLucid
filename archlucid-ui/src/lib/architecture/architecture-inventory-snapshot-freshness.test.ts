import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_INVENTORY_SNAPSHOT_STALE_AFTER_DAYS,
  formatArchitectureInventorySnapshotFreshnessCareerExportMarkdown,
  formatArchitectureInventorySnapshotStaleLineIfStale,
  isArchitectureInventorySnapshotStale,
} from "@/lib/architecture/architecture-inventory-snapshot-freshness";

describe("architecture-inventory-snapshot-freshness (AS-052)", () => {
  const now = new Date("2026-09-09T12:00:00.000Z");

  it("treats snapshots seven days old or older as stale", () => {
    expect(ARCHITECTURE_INVENTORY_SNAPSHOT_STALE_AFTER_DAYS).toBe(7);
    expect(isArchitectureInventorySnapshotStale("2026-09-02T12:00:00.000Z", now)).toBe(true);
    expect(isArchitectureInventorySnapshotStale("2026-09-03T12:00:00.000Z", now)).toBe(false);
    expect(isArchitectureInventorySnapshotStale(null, now)).toBe(false);
  });

  it("formats the bound-stale honesty line for the desk and career export", () => {
    const line = formatArchitectureInventorySnapshotStaleLineIfStale(
      {
        architectureId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
        isBound: true,
        snapshotCapturedUtc: "2026-07-18T12:00:00.000Z",
      },
      now,
    );

    expect(line).toBe("Bound snapshot captured 2026-07-18 — may not reflect current estate.");

    const markdown = formatArchitectureInventorySnapshotFreshnessCareerExportMarkdown(
      "2026-07-18T12:00:00.000Z",
      now,
    );

    expect(markdown).toContain("## Inventory freshness");
    expect(markdown).toContain("2026-07-18");
  });

  it("does not warn when unbound or fresh", () => {
    expect(
      formatArchitectureInventorySnapshotStaleLineIfStale({ isBound: false }, now),
    ).toBeNull();
    expect(
      formatArchitectureInventorySnapshotStaleLineIfStale(
        {
          isBound: true,
          snapshotCapturedUtc: "2026-09-08T12:00:00.000Z",
        },
        now,
      ),
    ).toBeNull();
  });
});
