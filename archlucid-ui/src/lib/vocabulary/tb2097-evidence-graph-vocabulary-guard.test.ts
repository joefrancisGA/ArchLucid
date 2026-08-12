/**
 * TB-2097 — Evidence graph is the surface name; Evidence trail stays the glossary concept.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS } from "@/lib/buyer/buyer-golden-journey-nav";
import { BUYER_EVIDENCE_GRAPH_EXPORT_EVIDENCE_TRAIL_CTA } from "@/lib/buyer/buyer-polish-copy";
import { EVIDENCE_GRAPH_PAGE_TITLE } from "@/lib/evidence-graph-page";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";

const SRC = join(process.cwd(), "src");
const DOCS = join(process.cwd(), "..", "docs", "library");

describe("TB-2097 Evidence graph vs Evidence trail vocabulary", () => {
  it("names the golden-journey step pill Evidence graph", () => {
    expect(BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS[2].label).toBe(BUYER_SURFACE_VOCABULARY.evidenceGraph);
    expect(BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS[2].label).toBe("Evidence graph");
  });

  it("keeps page title and export CTA free of Evidence trail surface naming", () => {
    expect(EVIDENCE_GRAPH_PAGE_TITLE).toBe("Evidence graph");
    expect(BUYER_EVIDENCE_GRAPH_EXPORT_EVIDENCE_TRAIL_CTA).toBe("Export trace table");
    expect(BUYER_EVIDENCE_GRAPH_EXPORT_EVIDENCE_TRAIL_CTA.toLowerCase()).not.toContain("evidence trail");
  });

  it("documents decision B in the UI design system", () => {
    const designSystem = readFileSync(join(DOCS, "UI_DESIGN_SYSTEM.md"), "utf8");

    expect(designSystem).toContain("Evidence trail vs Evidence graph (TB-2097 — decision B)");
    expect(designSystem).toContain("**Evidence trail**");
    expect(designSystem).toContain("**Evidence graph**");
  });

  it("keeps Evidence trail as the glossary concept term", () => {
    const glossary = readFileSync(join(SRC, "components/ProductConceptsGlossary.tsx"), "utf8");
    const manifest = readFileSync(join(SRC, "lib/customer-glossary-manifest.ts"), "utf8");

    expect(glossary).toContain('term: "Evidence trail"');
    expect(manifest).toContain('label: "Evidence trail"');
  });
});
