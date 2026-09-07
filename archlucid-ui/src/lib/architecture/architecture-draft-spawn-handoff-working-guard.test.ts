import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { resolveArchitectureReviewHref } from "@/lib/architecture/architecture-routes";

describe("architecture draft spawn handoff Working guard (AO-07)", () => {
  it("AO-07: handoff panel resolves nested review href when parent architecture is known", () => {
    expect(resolveArchitectureReviewHref("run-42", "architecture-identity-001")).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-42",
    );
    expect(resolveArchitectureReviewHref("run-42", "architecture-identity-001")).not.toBe(
      "/architecture/reviews/run-42",
    );
  });

  it("AO-07: spawn handoff modules do not import reviewDetailPath as the Working canonical locator", () => {
    const nestedHrefModules = [
      "components/architecture/ArchitectureDraftHandoffPanel.tsx",
      "components/architecture/ArchitectureIdentityDeskCurrentDraft.tsx",
    ];
    const startReviewModule = "hooks/use-architecture-draft-start-review.ts";

    for (const relativePath of nestedHrefModules) {
      const source = readFileSync(path.join(process.cwd(), "src", relativePath), "utf8");

      expect(source, relativePath).not.toContain("reviewDetailPath");
      expect(source, relativePath).toContain("resolveArchitectureReviewHref");
    }

    const startReviewSource = readFileSync(path.join(process.cwd(), "src", startReviewModule), "utf8");

    expect(startReviewSource).not.toContain("reviewDetailPath");
    expect(startReviewSource).toContain("startReviewFromDraftContextHref");
  });
});
