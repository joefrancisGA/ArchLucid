/**
 * TB-2096 — Evidence graph spine keeps only numbered step pills above the canvas.
 * Forbid prev/next arrows, Step N of M summary chrome, Review lifecycle banner, and tabs helper.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");

const FORBIDDEN_STRINGS = [
  "buyer-journey-prev",
  "buyer-journey-next",
  "EvidenceGraphLifecycleStatusBanner",
  "EVIDENCE_GRAPH_BANNER_TITLE",
  "EVIDENCE_GRAPH_BANNER_BODY",
  "EVIDENCE_GRAPH_TABS_HELPER",
  "EVIDENCE_GRAPH_VIEW_SIGNED_RECORD",
  "EVIDENCE_GRAPH_VIEW_GOVERNANCE_APPROVAL",
  "EVIDENCE_GRAPH_VIEW_AUDIT_TRAIL",
] as const;

const SCOPED_FILES = [
  "components/LayerContextStrip.tsx",
  "lib/evidence-graph-page.ts",
  "app/(operator)/insights/evidence-graph/_sections/GraphPageContent.tsx",
  "app/(operator)/insights/evidence-graph/_sections/GraphPageControls.tsx",
] as const;

describe("TB-2096 Evidence graph spine chrome guard", () => {
  it("forbids duplicate journey chrome above the evidence-graph canvas", () => {
    const violations: string[] = [];

    for (const relative of SCOPED_FILES) {
      const source = readFileSync(join(SRC, relative), "utf8");

      for (const needle of FORBIDDEN_STRINGS) {
        if (source.includes(needle)) {
          violations.push(`${relative}: ${needle}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("deletes the Review lifecycle banner component", () => {
    expect(
      existsSync(join(SRC, "components/governance/EvidenceGraphLifecycleStatusBanner.tsx")),
    ).toBe(false);
  });

  it("keeps numbered step-pill indicators on the golden-journey stepper", () => {
    const source = readFileSync(join(SRC, "components/LayerContextStrip.tsx"), "utf8");

    expect(source).toContain('data-testid="buyer-golden-journey-step-indicators"');
    expect(source).toContain("BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS");
  });
});
