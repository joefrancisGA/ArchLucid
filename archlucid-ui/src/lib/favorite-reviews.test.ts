import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  FAVORITE_REVIEWS_MAX,
  FAVORITE_REVIEWS_STORAGE_KEY,
  addFavoriteReview,
  isFavoriteReview,
  listFavoriteReviews,
  removeFavoriteReview,
  toggleFavoriteReview,
  writeFavoriteReviews,
  type FavoriteReview,
} from "@/lib/favorite-reviews";

describe("favorite-reviews", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useRealTimers();
  });

  it("lists an empty set when storage is empty", () => {
    expect(listFavoriteReviews()).toEqual([]);
  });

  it("persists add and list round-trip", () => {
    const seeded: FavoriteReview[] = [
      { runId: "run-a", title: "Claims API", pinnedAt: "2026-08-10T12:00:00.000Z" },
    ];

    writeFavoriteReviews(seeded);

    expect(window.localStorage.getItem(FAVORITE_REVIEWS_STORAGE_KEY)).not.toBeNull();
    expect(listFavoriteReviews()).toEqual(seeded);
    expect(isFavoriteReview(listFavoriteReviews(), "run-a")).toBe(true);
  });

  it("addFavoriteReview moves existing pin to the front and refreshes metadata", () => {
    const current: FavoriteReview[] = [
      { runId: "run-a", title: "Old", pinnedAt: "2026-08-01T00:00:00.000Z" },
      { runId: "run-b", pinnedAt: "2026-08-02T00:00:00.000Z" },
    ];

    const next = addFavoriteReview(current, {
      runId: "run-a",
      title: "Claims API",
      pinnedAt: "2026-08-10T15:00:00.000Z",
    });

    expect(next).toEqual([
      { runId: "run-a", title: "Claims API", pinnedAt: "2026-08-10T15:00:00.000Z" },
      { runId: "run-b", pinnedAt: "2026-08-02T00:00:00.000Z" },
    ]);
  });

  it("removeFavoriteReview drops by runId", () => {
    const current: FavoriteReview[] = [
      { runId: "run-a", pinnedAt: "2026-08-01T00:00:00.000Z" },
      { runId: "run-b", pinnedAt: "2026-08-02T00:00:00.000Z" },
    ];

    expect(removeFavoriteReview(current, "run-a")).toEqual([
      { runId: "run-b", pinnedAt: "2026-08-02T00:00:00.000Z" },
    ]);
  });

  it("toggleFavoriteReview adds then removes", () => {
    const empty: FavoriteReview[] = [];
    const added = toggleFavoriteReview(empty, {
      runId: "run-1",
      title: "Payments review",
      pinnedAt: "2026-08-10T10:00:00.000Z",
    });

    expect(isFavoriteReview(added, "run-1")).toBe(true);
    expect(toggleFavoriteReview(added, { runId: "run-1" })).toEqual([]);
  });

  it("caps favorites at FAVORITE_REVIEWS_MAX", () => {
    let current: FavoriteReview[] = [];

    for (let index = 0; index < FAVORITE_REVIEWS_MAX + 5; index += 1) {
      current = addFavoriteReview(current, {
        runId: `run-${index}`,
        pinnedAt: `2026-08-10T12:00:${String(index).padStart(2, "0")}.000Z`,
      });
    }

    expect(current).toHaveLength(FAVORITE_REVIEWS_MAX);
    expect(current[0]?.runId).toBe(`run-${FAVORITE_REVIEWS_MAX + 4}`);
    expect(isFavoriteReview(current, "run-0")).toBe(false);
  });

  it("ignores malformed storage payloads", () => {
    window.localStorage.setItem(FAVORITE_REVIEWS_STORAGE_KEY, "{not-json");
    expect(listFavoriteReviews()).toEqual([]);

    window.localStorage.setItem(FAVORITE_REVIEWS_STORAGE_KEY, JSON.stringify([{ runId: 1 }]));
    expect(listFavoriteReviews()).toEqual([]);

    window.localStorage.setItem(
      FAVORITE_REVIEWS_STORAGE_KEY,
      JSON.stringify([{ runId: " ok ", title: "  Title  ", pinnedAt: " 2026-08-10T00:00:00.000Z " }]),
    );
    expect(listFavoriteReviews()).toEqual([
      { runId: "ok", title: "Title", pinnedAt: "2026-08-10T00:00:00.000Z" },
    ]);
  });

  it("skips blank runIds on add", () => {
    expect(addFavoriteReview([], { runId: "   " })).toEqual([]);
  });
});