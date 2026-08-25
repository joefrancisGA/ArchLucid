import { describe, expect, it } from "vitest";

import { resolveContinueLastArchitectureDraftEntry } from "@/lib/architecture-draft-continue-last";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { writeArchitectureCreationDraftId } from "@/lib/architecture/architecture-creation-session";

function entry(
  architectureId: string,
  status: ArchitectureDraftRegistryEntry["customerStatus"] = "draft",
): ArchitectureDraftRegistryEntry {
  return {
    architectureId,
    displayName: `Draft ${architectureId}`,
    customerStatus: status,
    ownerLabel: "Owner",
    lastUpdatedUtc: "2026-01-02T00:00:00.000Z",
    linkedReviewId: null,
    serverUpdatedUtc: "2026-01-02T00:00:00.000Z",
  };
}

describe("architecture-draft-continue-last", () => {
  it("prefers session last-opened draft id", () => {
    writeArchitectureCreationDraftId("draft-session");

    expect(
      resolveContinueLastArchitectureDraftEntry([
        entry("draft-other"),
        entry("draft-session"),
      ])?.architectureId,
    ).toBe("draft-session");
  });

  it("falls back to most recently updated draft", () => {
    const newer = entry("draft-newer");
    const older = { ...entry("draft-older"), lastUpdatedUtc: "2026-01-01T00:00:00.000Z" };

    expect(resolveContinueLastArchitectureDraftEntry([older, newer])?.architectureId).toBe("draft-newer");
  });
});
