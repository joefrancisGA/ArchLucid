import { describe, expect, it } from "vitest";

import { buildCloudResourceExplorerWorkCountBadges } from "@/lib/infra-evidence/infra-evidence-explorer-work-counts";

describe("buildCloudResourceExplorerWorkCountBadges", () => {
  it("returns only positive work count badges", () => {
    const badges = buildCloudResourceExplorerWorkCountBadges({
      openOperationalFindingsCount: 2,
      openRemediationInstancesCount: 0,
      inventoryDriftChangeCount: 4,
    });

    expect(badges.map((badge) => badge.kind)).toEqual(["findings", "drift"]);
    expect(badges[0]?.count).toBe(2);
    expect(badges[1]?.count).toBe(4);
  });
});
