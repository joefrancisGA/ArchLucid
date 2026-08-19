import { describe, expect, it, beforeEach } from "vitest";

import {
  coldSharedLinkUnpackWatermarkKey,
  hasColdSharedLinkUnpackWatermark,
  isActivityNewSinceLastVisit,
  markColdSharedLinkUnpackSeen,
  markLastVisitedNow,
  readLastVisitedWatermark,
  reviewTabWatermarkKey,
  writeLastVisitedWatermark,
} from "@/lib/usability/last-visited-watermark";

describe("last-visited-watermark", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("treats activity as new when no watermark exists", () => {
    const key = reviewTabWatermarkKey("run-1", "findings");

    expect(isActivityNewSinceLastVisit(key, "2026-08-09T12:00:00.000Z")).toBe(true);
  });

  it("marks activity as seen after watermark write", () => {
    const key = reviewTabWatermarkKey("run-1", "findings");

    writeLastVisitedWatermark(key, "2026-08-09T12:00:00.000Z");

    expect(isActivityNewSinceLastVisit(key, "2026-08-09T11:00:00.000Z")).toBe(false);
    expect(isActivityNewSinceLastVisit(key, "2026-08-09T13:00:00.000Z")).toBe(true);
  });

  it("markLastVisitedNow prefers the supplied activity timestamp", () => {
    const key = reviewTabWatermarkKey("run-1", "overview");

    markLastVisitedNow(key, "2026-08-09T10:00:00.000Z");

    expect(readLastVisitedWatermark(key)).toBe("2026-08-09T10:00:00.000Z");
  });

  it("persists cold shared-link unpack dismiss watermark (TB-2181)", () => {
    expect(hasColdSharedLinkUnpackWatermark("run-cold")).toBe(false);
    markColdSharedLinkUnpackSeen("run-cold");
    expect(hasColdSharedLinkUnpackWatermark("run-cold")).toBe(true);
    expect(readLastVisitedWatermark(coldSharedLinkUnpackWatermarkKey("run-cold"))).not.toBeNull();
  });
});
