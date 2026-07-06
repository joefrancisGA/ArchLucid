import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";
import path from "node:path";

import { ARCHITECTURE_REVIEW_VOCABULARY } from "@/lib/architecture-review-vocabulary";
import { FIRST_PILOT_BUYER_COPY } from "@/lib/first-pilot-buyer-copy";
import { PILOT_PATH_PREVIEW_STEPS } from "@/lib/buyer-polish-copy";
import {
  REVIEW_TERMINOLOGY_ARCHITECT_WORKSPACE_SURFACE_PATHS,
  REVIEW_TERMINOLOGY_BANNED_OPERATOR_PATTERNS,
  REVIEW_TERMINOLOGY_BANNED_OPERATOR_PERSONA_PATTERNS,
  REVIEW_TERMINOLOGY_BANNED_PRIMARY_RUN_PATTERNS,
  REVIEW_TERMINOLOGY_BUYER_SURFACE_PATHS,
  REVIEW_TERMINOLOGY_FIRST_HOUR_SURFACE_PATHS,
  REVIEW_TERMINOLOGY_HIGH_TRAFFIC_SURFACE_PATHS,
  REVIEW_TERMINOLOGY_NAV_EMPTY_GLOSSARY_SURFACE_PATHS,
  REVIEW_TERMINOLOGY_REVIEW_PACKAGE_DETAIL_SURFACE_PATHS,
} from "@/lib/review-terminology-surfaces";
import { scanBuyerFacingTerminology, scanGlobalBuyerSurfaces } from "@/lib/review-terminology-scanner";
import { AUDIT_TRAIL_LABEL, SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import { resolveFirstPilotOperatingRailStepsForDisplay } from "@/lib/first-pilot-operating-rail-copy";

describe("review terminology guard", () => {
  it("uses review package as the primary buyer noun in shared vocabulary", () => {
    expect(ARCHITECTURE_REVIEW_VOCABULARY.buyerReviewPackageScopeHelp.toLowerCase()).toContain("review package");
    expect(ARCHITECTURE_REVIEW_VOCABULARY.correlationIdLabel.toLowerCase()).toContain("review");
    expect(ARCHITECTURE_REVIEW_VOCABULARY.runIdBridgeSentence.toLowerCase()).toContain("runid");
    expect(ARCHITECTURE_REVIEW_VOCABULARY.correlationIdFieldBridge.toLowerCase()).toContain("review id");
  });

  it("pilot path preview steps use review-first labels", () => {
    const reviewStep = PILOT_PATH_PREVIEW_STEPS.find((step) => step.id === "review");

    expect(reviewStep?.label).toBe("Review findings and add supporting evidence");
    expect(reviewStep?.label.toLowerCase()).toContain("review");
    expect(reviewStep?.label.toLowerCase()).not.toContain("run analysis");
    expect(reviewStep?.label.toLowerCase()).not.toContain("missing evidence");
  });

  it("high-traffic copy files avoid legacy run-primary labels", () => {
    for (const relativePath of REVIEW_TERMINOLOGY_HIGH_TRAFFIC_SURFACE_PATHS) {
      const source = readFileSync(path.join(process.cwd(), relativePath), "utf8").toLowerCase();

      for (const pattern of REVIEW_TERMINOLOGY_BANNED_PRIMARY_RUN_PATTERNS) {
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
    for (const relativePath of REVIEW_TERMINOLOGY_BUYER_SURFACE_PATHS) {
      const source = readFileSync(path.join(process.cwd(), relativePath), "utf8").toLowerCase();

      expect(source, relativePath).not.toContain("architecture run");
    }
  });

  it("first-hour Core Pilot surfaces avoid legacy run-primary labels", () => {
    for (const relativePath of REVIEW_TERMINOLOGY_FIRST_HOUR_SURFACE_PATHS) {
      const source = readFileSync(path.join(process.cwd(), relativePath), "utf8").toLowerCase();

      for (const pattern of REVIEW_TERMINOLOGY_BANNED_PRIMARY_RUN_PATTERNS) {
        expect(source, `${relativePath} should not contain "${pattern}"`).not.toContain(pattern);
      }
    }
  });

  it("Review Package detail surfaces avoid legacy run-primary labels (TB-621)", () => {
    for (const relativePath of REVIEW_TERMINOLOGY_REVIEW_PACKAGE_DETAIL_SURFACE_PATHS) {
      const source = readFileSync(path.join(process.cwd(), relativePath), "utf8").toLowerCase();

      for (const pattern of REVIEW_TERMINOLOGY_BANNED_PRIMARY_RUN_PATTERNS) {
        expect(source, `${relativePath} should not contain "${pattern}"`).not.toContain(pattern);
      }
    }
  });

  it("canonical product terms export audit trail label constant", () => {
    expect(AUDIT_TRAIL_LABEL).toBe("Audit trail");
    expect(SIGNED_MANIFEST_LABEL).toBe("Signed review record");
  });

  it("nav, empty-state, and glossary surfaces avoid operator persona copy", () => {
    for (const relativePath of REVIEW_TERMINOLOGY_NAV_EMPTY_GLOSSARY_SURFACE_PATHS) {
      const source = readFileSync(path.join(process.cwd(), relativePath), "utf8").toLowerCase();

      for (const pattern of REVIEW_TERMINOLOGY_BANNED_OPERATOR_PERSONA_PATTERNS) {
        expect(source, `${relativePath} should not contain "${pattern}"`).not.toContain(pattern);
      }
    }
  });

  it("architect workspace copy files avoid legacy operator persona labels", () => {
    const bannedOperatorPatternSet = new Set<string>(REVIEW_TERMINOLOGY_BANNED_OPERATOR_PATTERNS);

    for (const relativePath of REVIEW_TERMINOLOGY_ARCHITECT_WORKSPACE_SURFACE_PATHS) {
      const source = readFileSync(path.join(process.cwd(), relativePath), "utf8");
      const violations = scanBuyerFacingTerminology(relativePath, source).filter((violation) =>
        bannedOperatorPatternSet.has(violation.pattern),
      );

      expect(
        violations,
        violations.map((v) => `${v.relativePath}:${v.line} "${v.pattern}" — ${v.excerpt}`).join("\n"),
      ).toEqual([]);
    }
  });

  it("global buyer-facing surfaces avoid legacy run-primary and manifest jargon (TB-355)", () => {
    const violations = scanGlobalBuyerSurfaces();

    expect(
      violations,
      violations.map((v) => `${v.relativePath}:${v.line} "${v.pattern}" — ${v.excerpt}`).join("\n"),
    ).toEqual([]);
  }, 120_000);
});
