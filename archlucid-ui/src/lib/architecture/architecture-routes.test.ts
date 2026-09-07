import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";
import path from "node:path";

import {
  ARCHITECTURE_NEW_DRAFT_SEGMENT,
  architectureDraftPath,
  architectureIdentityDraftHref,
  architectureNestedDraftPath,
  architectureNestedReviewPath,
  ARCHITECTURES_NEW_PATH,
  isArchitectureNewDraftSegment,
  resolveArchitectureReviewHref,
  startReviewFromArchitectureHref,
} from "@/lib/architecture/architecture-routes";

describe("architecture-routes", () => {
  it("uses distinct canonical routes for architecture creation and review intake", () => {
    expect(ARCHITECTURES_NEW_PATH).toBe("/architecture/architectures/new");
    expect(ARCHITECTURE_NEW_DRAFT_SEGMENT).toBe("new");
    expect(isArchitectureNewDraftSegment("new")).toBe(true);
    expect(isArchitectureNewDraftSegment("draft-1")).toBe(false);
    expect(architectureDraftPath("draft-1")).toBe("/architecture/architectures/draft-1");
    expect(startReviewFromArchitectureHref("architecture-identity-001")).toBe(
      "/architecture/reviews/new?path=guided-intake&sourceArchitectureId=architecture-identity-001",
    );
  });

  it("pins identity desk child draft href for post-create navigation (CA-24 / AO-05)", () => {
    expect(architectureIdentityDraftHref("architecture-identity-001", "draft-001")).toBe(
      "/architecture/architectures/architecture-identity-001/drafts/draft-001",
    );
  });

  it("builds nested Working job paths (AO-02)", () => {
    expect(architectureNestedReviewPath("architecture-identity-001", "run-001")).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-001",
    );
    expect(architectureNestedDraftPath("architecture-identity-001", "draft-001")).toBe(
      "/architecture/architectures/architecture-identity-001/drafts/draft-001",
    );
    expect(resolveArchitectureReviewHref("run-001", "architecture-identity-001")).toBe(
      architectureNestedReviewPath("architecture-identity-001", "run-001"),
    );
  });

  it("CA-48: keeps draft segment path param honest and separate from identity desk paths", () => {
    const routesSource = readFileSync(
      path.join(process.cwd(), "src/lib/architecture/architecture-routes.ts"),
      "utf8",
    );

    expect(routesSource).toMatch(
      /function architectureIdentityDraftHref\(architectureId: string, draftId: string\)/,
    );
    expect(routesSource).toMatch(/function architectureDraftPath\(draftId: string\)/);
    expect(routesSource).not.toMatch(/function architectureDraftPath\(architectureId: string\)/);
    expect(routesSource).not.toMatch(/function architectureDraftPath\(\s*id:\s*string\s*\)/);
  });
});
