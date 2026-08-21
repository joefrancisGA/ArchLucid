import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";
import path from "node:path";

import { ARCHITECTURE_REVIEW_VOCABULARY } from "@/lib/vocabulary/architecture-review-vocabulary";
import {
  OPERATOR_HOME_WORKSPACE_EMPTY_BODY,
  OPERATOR_HOME_WORKSPACE_EMPTY_TITLE,
  PILOT_PATH_PREVIEW_STEPS,
} from "@/lib/buyer/buyer-polish-copy";
import { FIRST_PILOT_BUYER_COPY } from "@/lib/first-pilot-buyer-copy";
import { RUNS_EMPTY } from "@/lib/empty-state-presets";
import { RUNS_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import { governanceModeVocabulary } from "@/lib/vocabulary/governance-mode-vocabulary";
import { OPERATOR_NAV_LINK_LABELS, RUNS_LIST_PAGE_TITLES } from "@/lib/i18n";
import { COMMAND_PALETTE_CURATED_TASKS } from "@/lib/command-palette-curated-tasks";
import { ROUTE_TITLES } from "@/lib/route-static-titles";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";
import { SIGNED_RECORDS_LIST_TABLE_FINALIZED_COLUMN } from "@/app/(operator)/governance/sealed-records/_sections/signed-records-list-copy";
import { manifestStatusForDisplay } from "@/lib/manifest-status-display";
import {
  REVIEW_TERMINOLOGY_ARCHITECTURE_PACKAGE_LIST_NOUN_SURFACE_PATHS,
  REVIEW_TERMINOLOGY_ARCHITECT_WORKSPACE_SURFACE_PATHS,
  REVIEW_TERMINOLOGY_BANNED_FINALIZE_AUDIT_PATTERNS,
  REVIEW_TERMINOLOGY_BANNED_OPERATOR_PATTERNS,
  REVIEW_TERMINOLOGY_BANNED_OPERATOR_PERSONA_PATTERNS,
  REVIEW_TERMINOLOGY_BANNED_PRIMARY_RUN_PATTERNS,
  REVIEW_TERMINOLOGY_BANNED_REVIEW_ONLY_PACKAGE_LIST_PATTERNS,
  REVIEW_TERMINOLOGY_BUYER_SURFACE_PATHS,
  REVIEW_TERMINOLOGY_FINALIZE_AUDIT_SURFACE_PATHS,
  REVIEW_TERMINOLOGY_FIRST_HOUR_SURFACE_PATHS,
  REVIEW_TERMINOLOGY_GOLDEN_PATH_SURFACE_PATHS,
  REVIEW_TERMINOLOGY_HIGH_TRAFFIC_SURFACE_PATHS,
  REVIEW_TERMINOLOGY_NAV_EMPTY_GLOSSARY_SURFACE_PATHS,
  REVIEW_TERMINOLOGY_REVIEW_PACKAGE_DETAIL_SURFACE_PATHS,
} from "@/lib/review-terminology-surfaces";
import { scanBuyerFacingTerminology, scanGlobalBuyerSurfaces, scanGoldenPathBuyerCopy } from "@/lib/review-terminology-scanner";
import { AUDIT_TRAIL_LABEL, SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import { resolveFirstPilotOperatingRailStepsForDisplay } from "@/lib/first-pilot-operating-rail-copy";

describe("review terminology guard", () => {
  it("uses architecture review as the primary buyer noun in shared vocabulary", () => {
    expect(ARCHITECTURE_REVIEW_VOCABULARY.buyerReviewPackageScopeHelp.toLowerCase()).toContain("architecture review");
    expect(ARCHITECTURE_REVIEW_VOCABULARY.buyerReviewPackageScopeHelp.toLowerCase()).not.toContain("review package");
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
    expect(SIGNED_MANIFEST_LABEL).toBe("Finalized review record");
  });

  it("finalize/audit surfaces use one verb and one destination name", () => {
    for (const relativePath of REVIEW_TERMINOLOGY_FINALIZE_AUDIT_SURFACE_PATHS) {
      const source = readFileSync(path.join(process.cwd(), relativePath), "utf8").toLowerCase();

      for (const pattern of REVIEW_TERMINOLOGY_BANNED_FINALIZE_AUDIT_PATTERNS) {
        expect(source, `${relativePath} should not contain "${pattern}"`).not.toContain(pattern);
      }
    }
  });

  it("the signed-records date column is named for the finalized state, not the API status", () => {
    expect(SIGNED_RECORDS_LIST_TABLE_FINALIZED_COLUMN).toBe("Finalized");
    expect(manifestStatusForDisplay("Committed")).toBe(SIGNED_RECORDS_LIST_TABLE_FINALIZED_COLUMN);
  });

  it("nav, empty-state, and glossary surfaces avoid operator persona copy", () => {
    for (const relativePath of REVIEW_TERMINOLOGY_NAV_EMPTY_GLOSSARY_SURFACE_PATHS) {
      const source = readFileSync(path.join(process.cwd(), relativePath), "utf8").toLowerCase();

      for (const pattern of REVIEW_TERMINOLOGY_BANNED_OPERATOR_PERSONA_PATTERNS) {
        expect(source, `${relativePath} should not contain "${pattern}"`).not.toContain(pattern);
      }
    }
  });

  it("TB-738: reviews hub and nav use review-centered list nouns without package jargon", () => {
    for (const relativePath of REVIEW_TERMINOLOGY_ARCHITECTURE_PACKAGE_LIST_NOUN_SURFACE_PATHS) {
      const source = readFileSync(path.join(process.cwd(), relativePath), "utf8").toLowerCase();

      for (const pattern of REVIEW_TERMINOLOGY_BANNED_REVIEW_ONLY_PACKAGE_LIST_PATTERNS) {
        expect(source, `${relativePath} should not contain "${pattern}"`).not.toContain(pattern);
      }
    }

    expect(OPERATOR_NAV_LINK_LABELS.reviewPackage).toBe("Reviews");
    expect(RUNS_LIST_PAGE_TITLES.buyerPolished).toBe("Reviews");
    expect(governanceModeVocabulary(false).reviewPlural).toBe("Reviews");
    expect(governanceModeVocabulary(true).reviewPlural).toBe("Reviews");
    expect(RUNS_EMPTY.title).toBe("No reviews yet");
    expect(RUNS_EMPTY_COMPACT.title).toBe("No reviews yet");
    expect(OPERATOR_HOME_WORKSPACE_EMPTY_TITLE).toBe("No reviews yet");
    expect(OPERATOR_HOME_WORKSPACE_EMPTY_BODY.toLowerCase()).toContain("in-progress and completed");
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

  it("IA-006: converged surfaces share one nav label per route family", () => {
    const alignedRoutes = [
      { path: "/insights/evidence-graph", navLabel: OPERATOR_NAV_LINK_LABELS.evidenceGraph, paletteHref: "/insights/evidence-graph" },
      { path: "/governance/findings", navLabel: OPERATOR_NAV_LINK_LABELS.findings, paletteHref: null },
      { path: "/administration/workspace-settings", navLabel: OPERATOR_NAV_LINK_LABELS.workspaceSettings, paletteHref: null },
    ] as const;

    for (const route of alignedRoutes) {
      expect(ROUTE_TITLES[route.path], route.path).toBe(route.navLabel);
      expect(pageHelpTopicForPathname(route.path)?.label, route.path).toBe(route.navLabel);

      if (route.paletteHref !== null) {
        const paletteTask = COMMAND_PALETTE_CURATED_TASKS.find((task) => task.href === route.paletteHref);

        expect(paletteTask?.label, route.path).toBe(route.navLabel);
      }
    }
  });

  it("TB-2131: golden-path surfaces avoid residual eng jargon on primary chrome", () => {
    for (const relativePath of REVIEW_TERMINOLOGY_GOLDEN_PATH_SURFACE_PATHS) {
      const source = readFileSync(path.join(process.cwd(), relativePath), "utf8");
      const violations = scanGoldenPathBuyerCopy(relativePath, source);

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
