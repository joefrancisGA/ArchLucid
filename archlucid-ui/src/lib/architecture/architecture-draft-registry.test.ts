import { beforeEach, describe, expect, it } from "vitest";

import {
  getArchitectureDraftRegistrySnapshot,
  removeArchitectureDraftRegistryEntry,
  upsertArchitectureDraftRegistryEntry,
  type ArchitectureDraftRegistryEntry,
} from "@/lib/architecture/architecture-draft-registry";

function sampleEntry(draftId: string): ArchitectureDraftRegistryEntry {
  return {
    draftId,
    displayName: `Draft ${draftId}`,
    customerStatus: "draft",
    ownerLabel: "You",
    lastUpdatedUtc: "2026-08-27T12:00:00.000Z",
    linkedReviewId: null,
    serverUpdatedUtc: "2026-08-27T12:00:00.000Z",
    serverDraftStatus: "Drafting",
  };
}

describe("architecture draft registry snapshot cache", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("refreshes useSyncExternalStore snapshot after removing the last draft", () => {
    upsertArchitectureDraftRegistryEntry(sampleEntry("draft-last"));

    expect(getArchitectureDraftRegistrySnapshot()).toHaveLength(1);

    removeArchitectureDraftRegistryEntry("draft-last");

    expect(getArchitectureDraftRegistrySnapshot()).toHaveLength(0);
  });

  it("refreshes useSyncExternalStore snapshot after removing one of multiple drafts", () => {
    upsertArchitectureDraftRegistryEntry(sampleEntry("draft-keep"));
    upsertArchitectureDraftRegistryEntry(sampleEntry("draft-remove"));

    expect(getArchitectureDraftRegistrySnapshot()).toHaveLength(2);

    removeArchitectureDraftRegistryEntry("draft-remove");

    const remaining = getArchitectureDraftRegistrySnapshot();

    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.draftId).toBe("draft-keep");
  });
});
