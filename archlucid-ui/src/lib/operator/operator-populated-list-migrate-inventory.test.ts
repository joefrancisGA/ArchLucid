import { describe, expect, it } from "vitest";

import { OPERATOR_DATA_TABLE_RAW_TABLE_BASELINE_PATHS } from "@/lib/operator/operator-data-table-raw-table-baseline";
import {
  OPERATOR_POPULATED_LIST_MIGRATE_INVENTORY,
  operatorPopulatedListInventoryByDisposition,
} from "@/lib/operator/operator-populated-list-migrate-inventory";

describe("operator-populated-list-migrate-inventory (TB-1649)", () => {
  it("tracks honesty/action-budget closures for recurrence, digests, and reviews hub", () => {
    const doneIds = operatorPopulatedListInventoryByDisposition("honesty-action-budget-done").map((entry) => entry.id);

    expect(doneIds).toEqual(
      expect.arrayContaining([
        "recurrence-schedules-inventory",
        "digest-subscriptions-inventory",
        "reviews-hub-run-status",
      ]),
    );
  });

  it("includes every raw-table baseline path as pending migrate inventory", () => {
    const pendingPaths = operatorPopulatedListInventoryByDisposition("raw-table-pending").map(
      (entry) => entry.componentOrModule,
    );

    expect([...pendingPaths].sort()).toEqual([...OPERATOR_DATA_TABLE_RAW_TABLE_BASELINE_PATHS].sort());
    expect(OPERATOR_POPULATED_LIST_MIGRATE_INVENTORY.length).toBeGreaterThan(
      OPERATOR_DATA_TABLE_RAW_TABLE_BASELINE_PATHS.length,
    );
  });
});
