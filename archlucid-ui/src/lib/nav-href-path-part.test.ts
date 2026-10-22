import { describe, expect, it } from "vitest";

import { navHrefPathPart } from "@/lib/nav-href-path-part";

describe("navHrefPathPart", () => {
  it("strips fragments and query strings", () => {
    expect(navHrefPathPart("/help/getting-started#how-archlucid-works")).toBe("/help/getting-started");
    expect(navHrefPathPart("/architecture/reviews?status=open")).toBe("/architecture/reviews");
    expect(navHrefPathPart("/architecture/reviews?status=open#top")).toBe("/architecture/reviews");
    // A fragment before the query separator is still a fragment, so nothing after `#` survives.
    expect(navHrefPathPart("/architecture/reviews#top?status=open")).toBe("/architecture/reviews");
  });

  it("returns an empty string for same-page anchors and missing hrefs", () => {
    expect(navHrefPathPart("#recent")).toBe("");
    expect(navHrefPathPart("")).toBe("");
    expect(navHrefPathPart(null)).toBe("");
    expect(navHrefPathPart(undefined)).toBe("");
  });

  it("leaves a plain path unchanged", () => {
    expect(navHrefPathPart("/governance/findings")).toBe("/governance/findings");
    expect(navHrefPathPart("/")).toBe("/");
  });
});
