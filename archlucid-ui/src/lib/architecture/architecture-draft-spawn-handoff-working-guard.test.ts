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

  it("SY-25: intake blocked redirect uses nested review href on Working", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src", "lib/architecture/architecture-draft-intake-mode.ts"),
      "utf8",
    );

    expect(source).toContain("resolveArchitectureReviewHref");
    expect(source).toContain("workingMode");
  });

  it("AO-07: spawn handoff modules do not import reviewDetailPath as the Working canonical locator", () => {
    const nestedHrefModules: { readonly path: string; readonly hrefHelper: string }[] = [
      {
        path: "components/architecture/ArchitectureDraftHandoffPanel.tsx",
        hrefHelper: "resolveArchitectureReviewHref",
      },
      {
        path: "components/architecture/ArchitectureIdentityDeskCurrentDraft.tsx",
        hrefHelper: "resolveSystemNotJobDeskSealedChildReviewHref",
      },
    ];
    const startReviewModule = "hooks/use-architecture-draft-start-review.ts";

    for (const module of nestedHrefModules) {
      const source = readFileSync(path.join(process.cwd(), "src", module.path), "utf8");

      expect(source, module.path).not.toContain("reviewDetailPath");
      expect(source, module.path).toContain(module.hrefHelper);
    }

    const startReviewSource = readFileSync(path.join(process.cwd(), "src", startReviewModule), "utf8");

    expect(startReviewSource).not.toContain("reviewDetailPath");
    expect(startReviewSource).toContain("startReviewFromDraftContextHref");
  });
});
