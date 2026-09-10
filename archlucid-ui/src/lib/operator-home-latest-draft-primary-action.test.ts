import { describe, expect, it } from "vitest";

import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import {
  isArchitectureDraftPastDraftingOnRegistryEntry,
  resolveOperatorHomeLatestDraftPrimaryAction,
} from "@/lib/operator-home-latest-draft-primary-action";

function entry(
  overrides: Partial<ArchitectureDraftRegistryEntry> = {},
): ArchitectureDraftRegistryEntry {
  return {
    draftId: "draft-001",
    displayName: "Vertex",
    customerStatus: "draft",
    ownerLabel: "You",
    lastUpdatedUtc: "2026-01-01T00:00:00.000Z",
    linkedReviewId: null,
    serverUpdatedUtc: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("isArchitectureDraftPastDraftingOnRegistryEntry", () => {
  it("treats admitted server statuses as past drafting", () => {
    expect(isArchitectureDraftPastDraftingOnRegistryEntry(entry({ serverDraftStatus: "Admitted" }))).toBe(true);
  });

  it("keeps submitted server statuses on the architecture draft workspace", () => {
    expect(isArchitectureDraftPastDraftingOnRegistryEntry(entry({ serverDraftStatus: "Submitted" }))).toBe(false);
  });

  it("treats legacy ready-for-review registry rows as past drafting", () => {
    expect(
      isArchitectureDraftPastDraftingOnRegistryEntry(
        entry({ customerStatus: "ready-for-review", serverDraftStatus: undefined }),
      ),
    ).toBe(true);
  });

  it("keeps editable drafting rows on the draft workspace", () => {
    expect(isArchitectureDraftPastDraftingOnRegistryEntry(entry())).toBe(false);
  });
});

describe("resolveOperatorHomeLatestDraftPrimaryAction", () => {
  it("routes editable drafts to the architecture draft workspace", () => {
    const action = resolveOperatorHomeLatestDraftPrimaryAction(entry());

    expect(action).toEqual({
      href: "/architecture/architectures/draft-001",
      ctaLabel: "Resume latest draft",
      kind: "resume-draft",
    });
  });

  it("AO-08: nested draft workspace when parent architecture id is known", () => {
    const action = resolveOperatorHomeLatestDraftPrimaryAction(
      entry({ parentArchitectureId: "architecture-identity-001" }),
    );

    expect(action).toEqual({
      href: "/architecture/architectures/architecture-identity-001/drafts/draft-001",
      ctaLabel: "Resume latest draft",
      kind: "resume-draft",
    });
  });

  it("routes submitted drafts without a spawned run back to the architecture draft workspace", () => {
    const action = resolveOperatorHomeLatestDraftPrimaryAction(
      entry({ serverDraftStatus: "Submitted" }),
    );

    expect(action).toEqual({
      href: "/architecture/architectures/draft-001",
      ctaLabel: "Resume latest draft",
      kind: "resume-draft",
    });
  });

  it("returns null when a linked review exists — Working Home defers to architecture desk (AO-13)", () => {
    const action = resolveOperatorHomeLatestDraftPrimaryAction(
      entry({ linkedReviewId: "run-001", serverDraftStatus: "RunSpawned" }),
    );

    expect(action).toBeNull();
  });
});
