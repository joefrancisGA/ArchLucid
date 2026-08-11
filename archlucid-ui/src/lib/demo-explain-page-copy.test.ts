import { describe, expect, it } from "vitest";

import {
  DEMO_EXPLAIN_CONVERSION_REVIEW_HREF,
  DEMO_EXPLAIN_EVIDENCE_TRAIL_PANEL_TITLE,
  DEMO_EXPLAIN_EXPLANATION_PANEL_TITLE,
  DEMO_EXPLAIN_MANIFEST_VERSION_LABEL,
  DEMO_EXPLAIN_PAGE_TITLE,
  DEMO_EXPLAIN_REVIEW_ID_LABEL,
  formatDemoExplainGeneratedLabel,
  resolveDemoExplainConversionPrimaryHref,
  resolveDemoExplainStatusTag,
} from "@/lib/demo-explain-page-copy";

describe("demo-explain-page-copy (TB-1320)", () => {
  it("labels manifest version separately from review id", () => {
    expect(DEMO_EXPLAIN_MANIFEST_VERSION_LABEL.toLowerCase()).toContain("manifest");
    expect(DEMO_EXPLAIN_MANIFEST_VERSION_LABEL.toLowerCase()).not.toContain("review");
    expect(DEMO_EXPLAIN_REVIEW_ID_LABEL).toBe("Review ID");
  });

  it("formats generated time for display without echoing raw ISO in the prefix line", () => {
    const label = formatDemoExplainGeneratedLabel("2026-04-20T12:00:00.000Z");

    expect(label).toMatch(/^Generated /);
    expect(label).not.toBe("2026-04-20T12:00:00.000Z");
    expect(label).toContain("UTC");
  });

  it("uses draft status for illustrative demo data", () => {
    const tag = resolveDemoExplainStatusTag(true, "demo tenant — replace before publishing");

    expect(tag.kind).toBe("draft");
    expect(tag.label).toBe("demo tenant — replace before publishing");
  });

  it("routes anonymous conversion CTA through sign-in with wizard return path (TB-1323)", () => {
    const href = resolveDemoExplainConversionPrimaryHref(false);

    expect(href).toContain("/auth/signin");
    expect(href).toContain(encodeURIComponent(DEMO_EXPLAIN_CONVERSION_REVIEW_HREF));
    expect(resolveDemoExplainConversionPrimaryHref(true)).toBe(DEMO_EXPLAIN_CONVERSION_REVIEW_HREF);
  });

  it("TB-1319: uses buyer vocabulary for page and panel titles", () => {
    expect(DEMO_EXPLAIN_PAGE_TITLE.toLowerCase()).not.toContain("provenance graph");
    expect(DEMO_EXPLAIN_EVIDENCE_TRAIL_PANEL_TITLE).toBe("Evidence trail");
    expect(DEMO_EXPLAIN_EXPLANATION_PANEL_TITLE).toBe("Explanation & citations");
    expect(DEMO_EXPLAIN_EVIDENCE_TRAIL_PANEL_TITLE.toLowerCase()).not.toContain("provenance");
  });
});
