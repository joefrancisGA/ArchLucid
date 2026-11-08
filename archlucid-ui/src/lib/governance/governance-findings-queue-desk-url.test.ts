import { describe, expect, it } from "vitest";

import {
  governanceFindingsQueueDeskHrefFromSearch,
  resolveGovernanceFindingsQueueDeskSelectionFromSearch,
  resolveGovernanceFindingsQueuePathInspectFindingIdForDeskUrl,
} from "@/lib/governance/governance-findings-queue-desk-url";
import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { governanceFindingsQueueAvailableFindingIdSet } from "@/lib/governance/governance-findings-queue-selection";

describe("governanceFindingsQueueDeskHrefFromSearch", () => {
  it("writes bulk and findingId for a sole selection", () => {
    expect(
      governanceFindingsQueueDeskHrefFromSearch(
        "architectureId=customer-intake",
        "/compliance/findings",
        { bulkFindingIds: ["finding-a"], pathInspectFindingId: "finding-a" },
      ),
    ).toBe("/compliance/findings?architectureId=customer-intake&bulkFindings=finding-a&findingId=finding-a");
  });

  it("clears findingId when bulk selection is empty or ambiguous", () => {
    expect(
      governanceFindingsQueueDeskHrefFromSearch(
        "findingId=stale&bulkFindings=a%2Cb",
        "/compliance/findings",
        { bulkFindingIds: ["a", "b"], pathInspectFindingId: null },
      ),
    ).toBe("/compliance/findings?bulkFindings=a%2Cb");
  });
});

describe("resolveGovernanceFindingsQueuePathInspectFindingIdForDeskUrl", () => {
  it("returns the only bulk id or null", () => {
    expect(resolveGovernanceFindingsQueuePathInspectFindingIdForDeskUrl(["finding-1"])).toBe("finding-1");
    expect(resolveGovernanceFindingsQueuePathInspectFindingIdForDeskUrl([])).toBeNull();
    expect(resolveGovernanceFindingsQueuePathInspectFindingIdForDeskUrl(["a", "b"])).toBeNull();
  });
});

describe("resolveGovernanceFindingsQueueDeskSelectionFromSearch", () => {
  const available = new Set(["finding-a", "finding-b"]);

  it("prefers bulk over findingId", () => {
    expect(
      resolveGovernanceFindingsQueueDeskSelectionFromSearch(
        "bulkFindings=finding-a&findingId=finding-b",
        available,
      ),
    ).toEqual(new Set(["finding-a"]));
  });

  it("hydrates from findingId when bulk is absent", () => {
    expect(
      resolveGovernanceFindingsQueueDeskSelectionFromSearch("findingId=finding-b", available),
    ).toEqual(new Set(["finding-b"]));
  });

  it("matches bulkFindings to trimmed ids when register rows retain padding", () => {
    const paddedRow = {
      recordKind: "finding",
      findingId: "  finding-a  ",
    } as GovernanceFindingQueueRow;
    const availableFromRows = governanceFindingsQueueAvailableFindingIdSet([paddedRow]);

    expect(
      resolveGovernanceFindingsQueueDeskSelectionFromSearch("bulkFindings=finding-a", availableFromRows),
    ).toEqual(new Set(["finding-a"]));
  });
});
