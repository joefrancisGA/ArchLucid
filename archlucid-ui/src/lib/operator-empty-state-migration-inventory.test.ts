import { describe, expect, it } from "vitest";

import {
  listOperatorEmptyStateCompactNativeEntries,
  listOperatorEmptyStateDenseHubEntries,
  listOperatorEmptyStateMigratedEntries,
  OPERATOR_EMPTY_STATE_KINDS,
  OPERATOR_EMPTY_STATE_MIGRATION_INVENTORY,
} from "@/lib/operator-empty-state-migration-inventory";

describe("operator-empty-state-migration-inventory (TB-1554)", () => {
  it("names the operator empty kinds from the design-system contract", () => {
    expect(OPERATOR_EMPTY_STATE_KINDS).toEqual([
      "collection",
      "hub-zone",
      "filtered",
      "prerequisite",
      "permission",
    ]);
  });

  it("tracks compact-native exemplars and TB-1554 migrations", () => {
    const compactNative = listOperatorEmptyStateCompactNativeEntries();
    const migrated = listOperatorEmptyStateMigratedEntries();

    expect(compactNative.length).toBeGreaterThanOrEqual(8);
    expect(migrated.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(["governance-overview-no-pending", "standards-rules-empty"]),
    );

    for (const entry of listOperatorEmptyStateDenseHubEntries()) {
      expect(entry.chrome).toBe("compact");
    }
  });

  it("uses unique inventory ids for TB-1556 allowlist extension", () => {
    const ids = OPERATOR_EMPTY_STATE_MIGRATION_INVENTORY.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps centered OperatorEmptyState rows explicitly justified", () => {
    const justified = OPERATOR_EMPTY_STATE_MIGRATION_INVENTORY.filter(
      (entry) => entry.disposition === "centered-justified",
    );

    expect(justified.length).toBeGreaterThanOrEqual(2);
    expect(justified.some((entry) => entry.id === "governance-workflow-no-approvals")).toBe(true);
  });
});
