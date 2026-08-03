import { describe, expect, it } from "vitest";

import {
  PATH_CHOOSER_HELP_BRANCHES,
  PATH_CHOOSER_HELP_CANONICAL_PATH,
  PATH_CHOOSER_HELP_CLAIM_DISCIPLINE,
  PATH_CHOOSER_HELP_PRIMARY_ACTIONS,
  PATH_CHOOSER_HELP_SOURCES,
} from "@/lib/path-chooser-help-guide-content";

describe("path-chooser-help-guide-content", () => {
  it("keeps primary CTAs on review start, security-trust, and first-pilot path", () => {
    expect(PATH_CHOOSER_HELP_PRIMARY_ACTIONS.startReview.href).toBe("/architecture/reviews/new");
    expect(PATH_CHOOSER_HELP_PRIMARY_ACTIONS.securityTrust.href).toBe("/help/security-trust");
    expect(PATH_CHOOSER_HELP_PRIMARY_ACTIONS.firstPilotPath.href).toBe("/help/first-architecture-review");
    expect(PATH_CHOOSER_HELP_PRIMARY_ACTIONS.firstPilotPath.label).toBe("Your first architecture review");
  });

  it("maps five goal branches to in-app primary and fallback hrefs", () => {
    expect(PATH_CHOOSER_HELP_BRANCHES).toHaveLength(5);

    for (const branch of PATH_CHOOSER_HELP_BRANCHES) {
      expect(branch.primary.href.startsWith("/")).toBe(true);
      expect(branch.fallback.href.startsWith("/")).toBe(true);
      expect(branch.primary.href).not.toContain(".md");
      expect(branch.fallback.href).not.toContain(".md");
    }
  });

  it("lists Sources without a self-link to path-chooser", () => {
    expect(PATH_CHOOSER_HELP_SOURCES.some((link) => link.href === PATH_CHOOSER_HELP_CANONICAL_PATH)).toBe(false);
    expect(PATH_CHOOSER_HELP_SOURCES.some((link) => link.href === "/trust")).toBe(true);
  });

  it("states claim discipline without implying CPA or third-party pen test", () => {
    expect(PATH_CHOOSER_HELP_CLAIM_DISCIPLINE.toLowerCase()).toContain("not implied");
    expect(PATH_CHOOSER_HELP_CLAIM_DISCIPLINE.toLowerCase()).toContain("cpa");
  });
});
