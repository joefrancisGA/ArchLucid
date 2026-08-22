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
    architectureId: overrides.architectureId ?? "draft-001",
    displayName: overrides.displayName ?? "Vertex",
    customerStatus: overrides.customerStatus ?? "draft",
    ownerLabel: overrides.ownerLabel ?? "You",
    lastUpdatedUtc: overrides.lastUpdatedUtc ?? "2026-01-01T00:00:00.000Z",
    linkedReviewId: overrides.linkedReviewId ?? null,
    serverUpdatedUtc: overrides.serverUpdatedUtc ?? "2026-01-01T00:00:00.000Z",
    serverDraftStatus: overrides.serverDraftStatus,
  };
}

describe("isArchitectureDraftPastDraftingOnRegistryEntry", () => {
  it("treats submitted and admitted server statuses as past drafting", () => {
    expect(isArchitectureDraftPastDraftingOnRegistryEntry(entry({ serverDraftStatus: "Submitted" }))).toBe(true);
    expect(isArchitectureDraftPastDraftingOnRegistryEntry(entry({ serverDraftStatus: "Admitted" }))).toBe(true);
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

  it("routes submitted drafts without a spawned run to scoped review intake", () => {
    const action = resolveOperatorHomeLatestDraftPrimaryAction(
      entry({ serverDraftStatus: "Submitted" }),
    );

    expect(action).toEqual({
      href: "/architecture/reviews/new?path=guided-intake&sourceArchitectureId=draft-001",
      ctaLabel: "Continue in review intake",
      kind: "continue-intake",
    });
  });

  it("routes linked reviews to review detail", () => {
    const action = resolveOperatorHomeLatestDraftPrimaryAction(
      entry({ linkedReviewId: "run-001", serverDraftStatus: "RunSpawned" }),
    );

    expect(action).toEqual({
      href: "/architecture/reviews/run-001",
      ctaLabel: "Continue in review",
      kind: "continue-review",
    });
  });
});
