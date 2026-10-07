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
    expect(Date.parse(payload.updatedAtUtc)).not.toBeNaN();
  });

  it("refuses hydrate when continuity fetch is not explicit", () => {
    expect(
      shouldHydrateWorkingWorkspaceContinuityFromServer(
        { favoriteReviews: [], recentViewEntries: [], updatedAtUtc: "2026-09-13T12:00:00Z" },
        false,
      ),
    ).toBe(false);
  });

  it("hydrates title-only favorite rows from server without architectureId", () => {
    applyWorkingWorkspaceContinuityFromServer({
      favoriteReviews: [
        { runId: "run-title-only", pinnedAtUtc: "2026-09-13T12:00:00Z", title: "Claims API" },
      ],
      recentViewEntries: [],
      updatedAtUtc: "2026-09-13T12:02:00Z",
    });

    expect(JSON.parse(window.localStorage.getItem(FAVORITE_REVIEWS_STORAGE_KEY) ?? "[]")).toEqual([
      { runId: "run-title-only", pinnedAt: "2026-09-13T12:00:00Z", title: "Claims API" },
    ]);
  });

  it("writes local continuity watermark from server updatedAtUtc after hydrate", () => {
    applyWorkingWorkspaceContinuityFromServer({
      favoriteReviews: [],
      recentViewEntries: [],
      updatedAtUtc: "2026-09-13T12:02:00Z",
    });

    expect(window.localStorage.getItem(WORKING_WORKSPACE_CONTINUITY_SYNCED_AT_STORAGE_KEY)).toBe(
      "2026-09-13T12:02:00Z",
    );
  });

  it("hydrates from server when local continuity watermark is absent", () => {
    expect(
      shouldHydrateWorkingWorkspaceContinuityFromServer(
        { favoriteReviews: [], recentViewEntries: [], updatedAtUtc: "2026-09-13T09:00:00Z" },
        true,
      ),
    ).toBe(true);
  });

  it("hydrates when server omits updatedAtUtc even if local watermark exists", () => {
    window.localStorage.setItem(
      WORKING_WORKSPACE_CONTINUITY_SYNCED_AT_STORAGE_KEY,
      "2026-09-13T12:00:00Z",
    );

    expect(
      shouldHydrateWorkingWorkspaceContinuityFromServer(
        { favoriteReviews: [], recentViewEntries: [], updatedAtUtc: "" },
        true,
      ),
    ).toBe(true);
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

  it("clears local recents when server continuity payload omits recent view entries", () => {
    window.localStorage.setItem(
      OPERATOR_RECENT_VIEWS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        entries: [
          {
            href: "/architecture/architectures/arch-local",
            label: "Local architecture",
            kind: "architecture",
            visitedAtUtc: "2026-09-13T11:00:00Z",
            architectureId: "arch-local",
          },
        ],
      }),
    );

    applyWorkingWorkspaceContinuityFromServer({
      favoriteReviews: [{ runId: "run-9", pinnedAtUtc: "2026-09-13T12:00:00Z" }],
      recentViewEntries: [],
      updatedAtUtc: "2026-09-13T12:02:00Z",
    });

    const stored = JSON.parse(window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY) ?? "{}");

    expect(stored.entries).toEqual([]);
  });

  it("drops recent view rows when visitedAtUtc is whitespace-only", () => {
    applyWorkingWorkspaceContinuityFromServer({
      favoriteReviews: [],
      recentViewEntries: [
        {
          href: "/architecture/architectures/arch-9",
          label: "Architecture",
          kind: "architecture",
          visitedAtUtc: "   ",
          architectureId: "arch-9",
        },
      ],
      updatedAtUtc: "2026-09-13T12:02:00Z",
    });

    const stored = JSON.parse(window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY) ?? "{}");

    expect(stored.entries).toEqual([]);
  });

  it("buildWorkingWorkspaceContinuityPayload omits architectureId when local pin is title-only", () => {
    window.localStorage.setItem(
      FAVORITE_REVIEWS_STORAGE_KEY,
      JSON.stringify([{ runId: "run-1", pinnedAt: "2026-09-13T12:00:00Z", title: "Claims API" }]),
    );

    const payload = buildWorkingWorkspaceContinuityPayload();

    expect(payload.favoriteReviews).toEqual([
      { runId: "run-1", pinnedAtUtc: "2026-09-13T12:00:00Z", title: "Claims API" },
    ]);
  });

  it("clears local favorites when server continuity sends empty favoriteReviews", () => {
    window.localStorage.setItem(
      FAVORITE_REVIEWS_STORAGE_KEY,
      JSON.stringify([{ runId: "run-local", pinnedAt: "2026-09-13T11:00:00Z" }]),
    );

    applyWorkingWorkspaceContinuityFromServer({
      favoriteReviews: [],
      recentViewEntries: [],
      updatedAtUtc: "2026-09-13T12:02:00Z",
    });

    expect(JSON.parse(window.localStorage.getItem(FAVORITE_REVIEWS_STORAGE_KEY) ?? "[]")).toEqual([]);
  });

  it("drops favorite rows when pinnedAtUtc is whitespace-only", () => {
    applyWorkingWorkspaceContinuityFromServer({
      favoriteReviews: [{ runId: "run-9", pinnedAtUtc: "   " }],
      recentViewEntries: [],
      updatedAtUtc: "2026-09-13T12:02:00Z",
    });

    expect(JSON.parse(window.localStorage.getItem(FAVORITE_REVIEWS_STORAGE_KEY) ?? "[]")).toEqual([]);
  });

  it("drops favorite rows when runId is whitespace-only", () => {
    applyWorkingWorkspaceContinuityFromServer({
      favoriteReviews: [{ runId: "   ", pinnedAtUtc: "2026-09-13T12:00:00Z" }],
      recentViewEntries: [],
      updatedAtUtc: "2026-09-13T12:02:00Z",
    });

    expect(JSON.parse(window.localStorage.getItem(FAVORITE_REVIEWS_STORAGE_KEY) ?? "[]")).toEqual([]);
  });
});
