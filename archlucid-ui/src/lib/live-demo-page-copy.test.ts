import { describe, expect, it } from "vitest";

import {
  LIVE_DEMO_FABRICATED_DISCLOSURE,
  LIVE_DEMO_PAGE_METADATA_TITLE,
  LIVE_DEMO_PAGE_SUBTITLE,
  LIVE_DEMO_PAGE_TITLE,
} from "@/lib/live-demo-page-copy";

describe("live-demo-page-copy (TB-1265)", () => {
  it("uses honest sample-walkthrough title instead of Live demo", () => {
    expect(LIVE_DEMO_PAGE_TITLE).not.toBe("Live demo");
    expect(LIVE_DEMO_PAGE_TITLE.toLowerCase()).not.toMatch(/^live demo$/);
    expect(LIVE_DEMO_PAGE_TITLE.toLowerCase()).toContain("sample");
    expect(LIVE_DEMO_PAGE_TITLE.toLowerCase()).toContain("walkthrough");
  });

  it("keeps metadata title aligned with page H1", () => {
    expect(LIVE_DEMO_PAGE_METADATA_TITLE).toContain(LIVE_DEMO_PAGE_TITLE);
    expect(LIVE_DEMO_PAGE_METADATA_TITLE.toLowerCase()).not.toContain("live demo");
  });

  it("keeps subtitle and disclosure reinforcing fabricated sample reality", () => {
    expect(LIVE_DEMO_PAGE_SUBTITLE.toLowerCase()).toContain("sample");
    expect(LIVE_DEMO_PAGE_SUBTITLE.toLowerCase()).toContain("fabricated");
    expect(LIVE_DEMO_FABRICATED_DISCLOSURE.toLowerCase()).toContain("fabricated");
  });
});
