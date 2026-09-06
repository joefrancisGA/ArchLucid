import { describe, expect, it } from "vitest";

import {
  commandPaletteOpenArchitectureLabel,
  filterArchitectureIdentitiesForPaletteSearch,
} from "@/lib/command-palette-architecture-identities-search";
import type { ArchitectureIdentityListItem } from "@/types/architecture-identity";

const fixture: readonly ArchitectureIdentityListItem[] = [
  {
    architectureId: "architecture-identity-001",
    displayName: "Payments platform",
    updatedUtc: "2026-01-01T00:00:00Z",
    draftCount: 1,
    reviewCount: 2,
  },
  {
    architectureId: "architecture-identity-002",
    displayName: "Claims intake",
    updatedUtc: "2026-01-02T00:00:00Z",
    draftCount: 0,
    reviewCount: 0,
  },
];

describe("filterArchitectureIdentitiesForPaletteSearch (CA-34)", () => {
  it("returns identity matches with architecture id href targets", () => {
    const matches = filterArchitectureIdentitiesForPaletteSearch(fixture, "payments");

    expect(matches).toHaveLength(1);
    expect(matches[0]?.architectureId).toBe("architecture-identity-001");
  });

  it("does not return rows when search is empty", () => {
    expect(filterArchitectureIdentitiesForPaletteSearch(fixture, "")).toEqual([]);
  });

  it("labels open rows with architecture vocabulary", () => {
    expect(commandPaletteOpenArchitectureLabel("Payments platform")).toBe("Open architecture Payments platform");
  });
});
