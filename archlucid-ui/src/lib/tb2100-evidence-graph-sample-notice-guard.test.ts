/**
 * TB-2100 — one in-page Claims Intake sample notice on Evidence graph (compact banner).
 * Shell demo badge may remain; picker sample status + trailing operator paragraph must not stack.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_TITLE } from "@/lib/buyer/buyer-polish-copy";

const SRC = join(process.cwd(), "src");
const SECTIONS = join(SRC, "app/(operator)/insights/evidence-graph/_sections");

describe("TB-2100 Evidence graph single sample notice", () => {
  it("keeps the Claims Intake sample label on the sample banner title", () => {
    expect(BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_TITLE).toMatch(/Claims Intake/i);
    expect(BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_TITLE.toLowerCase()).toContain("sample");
  });

  it("suppresses picker sample status while the sample banner is the in-page notice", () => {
    const controls = readFileSync(join(SECTIONS, "GraphPageControls.tsx"), "utf8");

    expect(controls).toContain('sampleGraphActive && reviewPickerState === "sample-review"');
    expect(controls).toContain("GraphReviewPickerStatus");
  });

  it("removes the trailing operator sample paragraph from GraphLoadedExperience", () => {
    const loaded = readFileSync(join(SECTIONS, "GraphLoadedExperience.tsx"), "utf8");

    expect(loaded).not.toContain("loads this graph automatically");
    expect(loaded).not.toContain("illustrative Claims Intake sample");
  });

  it("mounts GraphSampleModeBanner in compact mode from GraphPageContent", () => {
    const page = readFileSync(join(SECTIONS, "GraphPageContent.tsx"), "utf8");

    expect(page).toContain("<GraphSampleModeBanner");
    expect(page).toMatch(/GraphSampleModeBanner[\s\S]*compact/);
    expect((page.match(/<GraphSampleModeBanner\b/g) ?? []).length).toBe(1);
  });
});
