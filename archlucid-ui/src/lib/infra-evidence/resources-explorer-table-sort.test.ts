import { describe, expect, it } from "vitest";

import type { CloudResourceSummary } from "@/lib/infra-evidence/infra-evidence-hub-types";
import {
  RESOURCES_EXPLORER_DEFAULT_SORT_ASC,
  RESOURCES_EXPLORER_DEFAULT_SORT_KEY,
  sortResourceExplorerRows,
} from "@/lib/infra-evidence/resources-explorer-table-sort";

function buildRow(overrides: Partial<CloudResourceSummary> & Pick<CloudResourceSummary, "cloudResourceId">): CloudResourceSummary {
  return {
    externalResourceId: `/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/${overrides.displayName ?? "resource"}`,
    displayName: overrides.displayName ?? "resource",
    resourceType: overrides.resourceType ?? "Microsoft.Network/publicIPAddresses",
    resourceGroup: overrides.resourceGroup ?? "rg-net",
    region: overrides.region ?? "eastus",
    lastSeenUtc: overrides.lastSeenUtc ?? "2026-09-01T12:00:00Z",
    workCounts: overrides.workCounts ?? null,
    ...overrides,
  };
}

describe("resources-explorer-table-sort", () => {
  it("defaults to ascending name sort", () => {
    expect(RESOURCES_EXPLORER_DEFAULT_SORT_KEY).toBe("name");
    expect(RESOURCES_EXPLORER_DEFAULT_SORT_ASC).toBe(true);
  });

  it("sorts rows by display name ascending", () => {
    const rows = [
      buildRow({ cloudResourceId: "2", displayName: "zebra" }),
      buildRow({ cloudResourceId: "1", displayName: "alpha" }),
    ];

    const sorted = sortResourceExplorerRows(rows, "name", true);

    expect(sorted.map((row) => row.cloudResourceId)).toEqual(["1", "2"]);
  });

  it("sorts Last seen by instant across offset-less and explicitly zoned timestamps", () => {
    const rows = [
      buildRow({ cloudResourceId: "later", lastSeenUtc: "2026-09-01T12:00:00.5Z" }),
      buildRow({ cloudResourceId: "earliest", lastSeenUtc: "2026-09-01T13:59:00+02:00" }),
      buildRow({ cloudResourceId: "earlier", lastSeenUtc: "2026-09-01T12:00:00" }),
    ];

    expect(sortResourceExplorerRows(rows, "lastSeen", true).map((row) => row.cloudResourceId))
      .toEqual(["earliest", "earlier", "later"]);
    expect(sortResourceExplorerRows(rows, "lastSeen", false).map((row) => row.cloudResourceId))
      .toEqual(["later", "earlier", "earliest"]);
  });

  it("orders an exact UTC second before a later fractional timestamp", () => {
    const rows = [
      buildRow({ cloudResourceId: "later", lastSeenUtc: "2026-09-01T12:00:00.5Z" }),
      buildRow({ cloudResourceId: "earlier", lastSeenUtc: "2026-09-01T12:00:00Z" }),
    ];

    expect(sortResourceExplorerRows(rows, "lastSeen", true).map((row) => row.cloudResourceId))
      .toEqual(["earlier", "later"]);
  });

  it("sorts rows by display name descending", () => {
    const rows = [
      buildRow({ cloudResourceId: "1", displayName: "alpha" }),
      buildRow({ cloudResourceId: "2", displayName: "zebra" }),
    ];

    const sorted = sortResourceExplorerRows(rows, "name", false);

    expect(sorted.map((row) => row.cloudResourceId)).toEqual(["2", "1"]);
  });
});
