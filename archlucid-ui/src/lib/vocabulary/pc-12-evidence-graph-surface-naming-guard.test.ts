/**
 * PC-12 / TB-2097 — graph navigation surfaces use Evidence graph, not Evidence trail.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import {
  FINDING_EVIDENCE_LINK_GRAPH_LABEL,
  FINDING_EVIDENCE_LINK_VIEW_GRAPH_LABEL,
} from "@/lib/vocabulary/finding-evidence-link-chip-copy";

const SRC = join(process.cwd(), "src");

const PC_12_EVIDENCE_GRAPH_SURFACE_FILES = [
  "components/usability/FindingEvidenceLinkChip.tsx",
  "components/ManifestDetailSummaryCountsGrid.tsx",
  "components/runs/RunInspectorPreview.tsx",
] as const;

describe("PC-12 evidence graph surface naming (TB-2097)", () => {
  it("exposes canonical finding evidence link labels", () => {
    expect(FINDING_EVIDENCE_LINK_GRAPH_LABEL).toBe(BUYER_SURFACE_VOCABULARY.evidenceGraph);
    expect(FINDING_EVIDENCE_LINK_VIEW_GRAPH_LABEL).toBe("View graph");
  });

  it("keeps graph navigation surfaces free of Evidence trail link labels", () => {
    const offenders: string[] = [];

    for (const relativePath of PC_12_EVIDENCE_GRAPH_SURFACE_FILES) {
      const source = readFileSync(join(SRC, relativePath), "utf8");

      if (source.includes('"Evidence trail"')) {
        offenders.push(`${relativePath}: literal "Evidence trail"`);
      }

      if (source.includes('"View trail"')) {
        offenders.push(`${relativePath}: literal "View trail"`);
      }

      if (source.includes('"Evidence trail anchors"')) {
        offenders.push(`${relativePath}: literal "Evidence trail anchors"`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
