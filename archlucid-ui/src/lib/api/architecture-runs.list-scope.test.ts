import { describe, expect, it } from "vitest";

import { shouldListReviewsAcrossProjectSlugs } from "./architecture-runs";

describe("shouldListReviewsAcrossProjectSlugs", () => {
  it("lists across slugs for omitted or default project ids", () => {
    expect(shouldListReviewsAcrossProjectSlugs(undefined)).toBe(true);
    expect(shouldListReviewsAcrossProjectSlugs(null)).toBe(true);
    expect(shouldListReviewsAcrossProjectSlugs("")).toBe(true);
    expect(shouldListReviewsAcrossProjectSlugs("  ")).toBe(true);
    expect(shouldListReviewsAcrossProjectSlugs("default")).toBe(true);
    expect(shouldListReviewsAcrossProjectSlugs("DEFAULT")).toBe(true);
  });

  it("keeps an explicit non-default project slug filter", () => {
    expect(shouldListReviewsAcrossProjectSlugs("ArchLucid")).toBe(false);
    expect(shouldListReviewsAcrossProjectSlugs("claims-intake")).toBe(false);
  });
});
