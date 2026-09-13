import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FAVORITE_REVIEWS_STORAGE_KEY } from "@/lib/favorite-reviews";
import { OPERATOR_RECENT_VIEWS_STORAGE_KEY } from "@/lib/operator/operator-recent-views";
import {
  applyWorkingWorkspaceContinuityFromServer,
  buildWorkingWorkspaceContinuityPayload,
  shouldHydrateWorkingWorkspaceContinuityFromServer,
  WORKING_WORKSPACE_CONTINUITY_SYNCED_AT_STORAGE_KEY,
} from "@/lib/operator/working-workspace-continuity-sync";

describe("working-workspace-continuity-sync (IH-066)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("builds payload from local pins and recents", () => {
    window.localStorage.setItem(
      FAVORITE_REVIEWS_STORAGE_KEY,
      JSON.stringify([{ runId: "run-1", pinnedAt: "2026-09-13T12:00:00Z" }]),
    );
    window.localStorage.setItem(
      OPERATOR_RECENT_VIEWS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        entries: [
          {
            href: "/architecture/architectures/arch-1",
            label: "Architecture",
            kind: "architecture",
            visitedAtUtc: "2026-09-13T12:01:00Z",
            architectureId: "arch-1",
          },
        ],
      }),
    );

    const payload = buildWorkingWorkspaceContinuityPayload();

    expect(payload.favoriteReviews).toHaveLength(1);
    expect(payload.recentViewEntries).toHaveLength(1);
    expect(payload.updatedAtUtc).toBeTruthy();
  });

  it("hydrates local storage when server watermark is newer", () => {
    window.localStorage.setItem(
      WORKING_WORKSPACE_CONTINUITY_SYNCED_AT_STORAGE_KEY,
      "2026-09-13T10:00:00Z",
    );

    applyWorkingWorkspaceContinuityFromServer({
      favoriteReviews: [{ runId: "run-9", pinnedAtUtc: "2026-09-13T12:00:00Z" }],
      recentViewEntries: [
        {
          href: "/architecture/architectures/arch-9",
          label: "Architecture",
          kind: "architecture",
          visitedAtUtc: "2026-09-13T12:01:00Z",
          architectureId: "arch-9",
        },
      ],
      updatedAtUtc: "2026-09-13T12:02:00Z",
    });

    expect(JSON.parse(window.localStorage.getItem(FAVORITE_REVIEWS_STORAGE_KEY) ?? "[]")).toEqual([
      { runId: "run-9", pinnedAt: "2026-09-13T12:00:00Z" },
    ]);
    expect(
      shouldHydrateWorkingWorkspaceContinuityFromServer(
        { favoriteReviews: [], recentViewEntries: [], updatedAtUtc: "2026-09-13T09:00:00Z" },
        true,
      ),
    ).toBe(false);
  });
});
