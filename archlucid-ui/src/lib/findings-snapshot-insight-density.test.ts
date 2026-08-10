import { describe, expect, it } from "vitest";

import type { RunDetail } from "@/types/authority";

import {
  formatInsightDensityCurationMessage,
  hasFindingsSnapshotInsightDensityContent,
  resolveFindingsSnapshotInsightDensityView,
} from "./findings-snapshot-insight-density";

describe("findings-snapshot-insight-density", () => {
  it("resolveFindingsSnapshotInsightDensityView returns empty when snapshot missing", () => {
    const view = resolveFindingsSnapshotInsightDensityView({ run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" } } as RunDetail);

    expect(view.checklistCoverage).toEqual([]);
    expect(view.curation).toBeNull();
  });

  it("parses checklist rows and curation counts from findingsSnapshot wire", () => {
    const detail = {
      run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" },
      findingsSnapshot: {
        checklistCoverage: [
          {
            findingId: "chk-1",
            message: "Enable monitoring",
            category: "Hygiene",
            reasoningTrace: "Standard observability baseline.",
          },
        ],
        insightDensityCuration: {
          demotedToChecklistCount: 1,
          retainedFindingCount: 2,
        },
      },
    } as RunDetail;

    const view = resolveFindingsSnapshotInsightDensityView(detail);

    expect(view.checklistCoverage).toHaveLength(1);
    expect(view.checklistCoverage[0]?.findingId).toBe("chk-1");
    expect(view.checklistCoverage[0]?.title).toBe("Enable monitoring");
    expect(view.curation).toEqual({ demotedToChecklistCount: 1, retainedFindingCount: 2 });
  });

  it("formatInsightDensityCurationMessage renders buyer copy", () => {
    expect(
      formatInsightDensityCurationMessage({ demotedToChecklistCount: 3, retainedFindingCount: 2 }),
    ).toContain("suppressed 3");
    expect(formatInsightDensityCurationMessage({ demotedToChecklistCount: 0, retainedFindingCount: 0 })).toBe("");
  });

  it("hasFindingsSnapshotInsightDensityContent is false when there is nothing to disclose", () => {
    expect(hasFindingsSnapshotInsightDensityContent({ checklistCoverage: [], curation: null })).toBe(false);
    expect(
      hasFindingsSnapshotInsightDensityContent({
        checklistCoverage: [],
        curation: { demotedToChecklistCount: 0, retainedFindingCount: 0 },
      }),
    ).toBe(false);
  });

  it("hasFindingsSnapshotInsightDensityContent is true for checklist rows or curation copy", () => {
    expect(
      hasFindingsSnapshotInsightDensityContent({
        checklistCoverage: [{ findingId: "chk-1", title: "Enable monitoring", category: null, recommendation: null }],
        curation: null,
      }),
    ).toBe(true);
    expect(
      hasFindingsSnapshotInsightDensityContent({
        checklistCoverage: [],
        curation: { demotedToChecklistCount: 0, retainedFindingCount: 2 },
      }),
    ).toBe(true);
  });
});
