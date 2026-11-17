import { describe, expect, it } from "vitest";

import { resolveArchitectureIdentityCurrentDraftState } from "@/lib/architecture/architecture-identity-current-draft";
import type { ArchitectureIdentityChildDraftSummary } from "@/types/architecture-identity";

function draft(
  overrides: Partial<ArchitectureIdentityChildDraftSummary> = {},
): ArchitectureIdentityChildDraftSummary {
  return {
    draftId: "draft-1",
    status: "Drafting",
    systemName: "Payments",
    updatedUtc: "2026-01-02T00:00:00Z",
    ...overrides,
  };
}

describe("resolveArchitectureIdentityCurrentDraftState", () => {
  it("prefers an editable drafting child over a spawn-locked draft", () => {
    const state = resolveArchitectureIdentityCurrentDraftState(
      [
        draft({ draftId: "spawned-1", status: "RunSpawned", updatedUtc: "2026-01-03T00:00:00Z" }),
        draft({ draftId: "draft-open", status: "Drafting", updatedUtc: "2026-01-02T00:00:00Z" }),
      ],
      "spawned-1",
      "review-1",
    );

    expect(state).toEqual({ kind: "drafting", draftId: "draft-open" });
  });

  it("opens the latest editable draft when timestamps share a second", () => {
    const state = resolveArchitectureIdentityCurrentDraftState(
      [
        draft({ draftId: "newer", updatedUtc: "2026-01-02T00:00:00.1Z" }),
        draft({ draftId: "older", updatedUtc: "2026-01-02T00:00:00Z" }),
      ],
      "newer",
      null,
    );

    expect(state).toEqual({ kind: "drafting", draftId: "newer" });
  });

  it("surfaces spawn-locked handoff when no drafting child exists", () => {
    const state = resolveArchitectureIdentityCurrentDraftState(
      [draft({ draftId: "spawned-1", status: "RunSpawned" })],
      "spawned-1",
      "review-1",
    );

    expect(state).toEqual({
      kind: "spawn-locked",
      draftId: "spawned-1",
      linkedReviewId: "review-1",
    });
  });
});
