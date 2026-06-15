import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";
import path from "node:path";

import { ARCHITECTURE_REVIEW_VOCABULARY } from "@/lib/architecture-review-vocabulary";
import { FIRST_PILOT_BUYER_COPY } from "@/lib/first-pilot-buyer-copy";
import { AUDIT_TRAIL_LABEL, SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import { resolveFirstPilotOperatingRailStepsForDisplay } from "@/lib/first-pilot-operating-rail-copy";
import { PILOT_PATH_PREVIEW_STEPS } from "@/lib/buyer-polish-copy";

const BUYER_SURFACE_FILES = [
  "src/lib/first-pilot-buyer-copy.ts",
  "src/lib/first-pilot-operating-rail-copy.ts",
  "src/components/EmailRunToSponsorBanner.tsx",
] as const;

const HIGH_TRAFFIC_COPY_FILES = [
  "src/lib/buyer-polish-copy.ts",
  "src/lib/contextual-help-content.ts",
  "src/components/LlmMonthlyBudgetExceededBanner.tsx",
  "src/components/RunDetailRunGovernanceDispositionActions.tsx",
  "src/app/(executive)/executive/scorecard/ExecutiveScorecardClient.tsx",
] as const;

const PRIMARY_RUN_LABEL_PATTERNS = [
  "run analysis",
  "committed runs",
  "previous runs",
  "approve run",
  "reject run",
  "run disposition",
  "for this run",
  "this run ",
  "the run in",
  "read runs",
  "create runs",
  "trial run limit",
] as const;

describe("review terminology guard", () => {
  it("uses review package as the primary buyer noun in shared vocabulary", () => {
    expect(ARCHITECTURE_REVIEW_VOCABULARY.buyerReviewPackageScopeHelp.toLowerCase()).toContain("review package");
    expect(ARCHITECTURE_REVIEW_VOCABULARY.correlationIdLabel.toLowerCase()).toContain("review");
    expect(ARCHITECTURE_REVIEW_VOCABULARY.runIdBridgeSentence.toLowerCase()).toContain("runid");
    expect(ARCHITECTURE_REVIEW_VOCABULARY.correlationIdFieldBridge.toLowerCase()).toContain("review id");
  });

  it("pilot path preview steps use review-first labels", () => {
    const analyzeStep = PILOT_PATH_PREVIEW_STEPS.find((step) => step.id === "analyze");

    expect(analyzeStep?.label.toLowerCase()).toContain("review");
    expect(analyzeStep?.label.toLowerCase()).not.toContain("run analysis");
  });

  it("high-traffic copy files avoid legacy run-primary labels", () => {
    for (const relativePath of HIGH_TRAFFIC_COPY_FILES) {
      const source = readFileSync(path.join(process.cwd(), relativePath), "utf8").toLowerCase();

      for (const pattern of PRIMARY_RUN_LABEL_PATTERNS) {
        expect(source, `${relativePath} should not contain "${pattern}"`).not.toContain(pattern);
      }
    }
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

  it("canonical product terms export audit trail label constant", () => {
    expect(AUDIT_TRAIL_LABEL).toBe("Audit trail");
    expect(SIGNED_MANIFEST_LABEL).toBe("Signed manifest");
  });
});
