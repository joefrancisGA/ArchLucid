import { describe, expect, it } from "vitest";

import {
  SHOWCASE_CURATED_STATIC_DISCLOSURE,
  SHOWCASE_FORBIDDEN_LIVE_PREVIEW_PHRASES,
  SHOWCASE_ILLUSTRATIVE_SAMPLE_TITLE,
  SHOWCASE_OFFLINE_ILLUSTRATIVE_DISCLOSURE,
} from "@/lib/showcase-disclosure-copy";

describe("showcase-disclosure-copy", () => {
  it("uses illustrative sample framing without live-preview failure language", () => {
    const combined = [
      SHOWCASE_ILLUSTRATIVE_SAMPLE_TITLE,
      SHOWCASE_CURATED_STATIC_DISCLOSURE,
      SHOWCASE_OFFLINE_ILLUSTRATIVE_DISCLOSURE,
    ].join(" ");

    for (const phrase of SHOWCASE_FORBIDDEN_LIVE_PREVIEW_PHRASES) {
      expect(combined.toLowerCase()).not.toContain(phrase);
    }

    expect(SHOWCASE_CURATED_STATIC_DISCLOSURE).toContain("No sign-in required");
    expect(SHOWCASE_OFFLINE_ILLUSTRATIVE_DISCLOSURE.toLowerCase()).not.toContain("error");
  });
});
