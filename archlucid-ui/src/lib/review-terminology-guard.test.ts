import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";
import path from "node:path";

import { ARCHITECTURE_REVIEW_VOCABULARY } from "@/lib/architecture-review-vocabulary";
import { FIRST_PILOT_BUYER_COPY } from "@/lib/first-pilot-buyer-copy";
import { resolveFirstPilotOperatingRailStepsForDisplay } from "@/lib/first-pilot-operating-rail-copy";

const BUYER_SURFACE_FILES = [
  "src/lib/first-pilot-buyer-copy.ts",
  "src/lib/first-pilot-operating-rail-copy.ts",
] as const;

describe("review terminology guard", () => {
  it("uses review package as the primary buyer noun in shared vocabulary", () => {
    expect(ARCHITECTURE_REVIEW_VOCABULARY.buyerReviewPackageScopeHelp.toLowerCase()).toContain("review package");
    expect(ARCHITECTURE_REVIEW_VOCABULARY.correlationIdLabel.toLowerCase()).toContain("review");
  });

  it("first-pilot buyer copy prefers review over raw run jargon", () => {
    expect(FIRST_PILOT_BUYER_COPY.proofPipelineAction.toLowerCase()).not.toContain("architecture run");
    expect(FIRST_PILOT_BUYER_COPY.proofPipelineAction.toLowerCase()).toMatch(/review|proof|evidence/);
  });

  it("buyer-polished operating rail step labels avoid pipeline/run-primary nouns", () => {
    const steps = resolveFirstPilotOperatingRailStepsForDisplay(true);

    for (const step of steps) {
      expect(step.title.toLowerCase()).not.toContain("pipeline");
      expect(step.shortBody.toLowerCase()).not.toContain("architecture run");
    }
  });

  it("buyer surface source files avoid architecture run phrasing", () => {
    for (const relativePath of BUYER_SURFACE_FILES) {
      const source = readFileSync(path.join(process.cwd(), relativePath), "utf8").toLowerCase();

      expect(source, relativePath).not.toContain("architecture run");
    }
  });
});
