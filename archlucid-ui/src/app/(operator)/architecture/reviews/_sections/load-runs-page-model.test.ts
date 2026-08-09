import { describe, expect, it } from "vitest";

import { shouldListReviewsAcrossProjectSlugs } from "@/lib/api";

import { formatRunsPageProjectTitle } from "./load-runs-page-model";

describe("formatRunsPageProjectTitle", () => {
  it("labels the active project with a clear prefix", () => {
    expect(formatRunsPageProjectTitle("default")).toBe("Project: default");
    expect(formatRunsPageProjectTitle("claims-intake")).toBe("Project: claims-intake");
  });
});

describe("reviews hub project list mode", () => {
  it("uses scope-wide inventory for the default hub URL", () => {
    expect(shouldListReviewsAcrossProjectSlugs(undefined)).toBe(true);
    expect(shouldListReviewsAcrossProjectSlugs("default")).toBe(true);
  });

  it("keeps slug filtering when an explicit projectId is requested", () => {
    expect(shouldListReviewsAcrossProjectSlugs("ArchLucid")).toBe(false);
  });
});
