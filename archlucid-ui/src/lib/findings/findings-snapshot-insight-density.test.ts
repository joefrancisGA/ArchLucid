import { describe, expect, it } from "vitest";

import type { RunDetail } from "@/types/authority";

import {
  formatInsightDensityCurationMessage,
  hasFindingsSnapshotInsightDensityContent,
  INSIGHT_DENSITY_CURATION_COUNTS_NOT_STORED,
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
    expect(view.checklistCoverage[0]?.severityValue).toBeNull();
    expect(view.curation).toEqual({ demotedToChecklistCount: 1, retainedFindingCount: 2 });
  });

  it("formatInsightDensityCurationMessage renders buyer copy with gate demotion honesty", () => {
    const message = formatInsightDensityCurationMessage({
      demotedToChecklistCount: 3,
      retainedFindingCount: 2,
    });

    expect(message).toContain("insight-density gate demotes");
    expect(message).toContain("moved 3");
  });

  it("readFindingTitle does not substitute category when message is missing", () => {
    const detail = {
      run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" },
      findingsSnapshot: {
        checklistCoverage: [
          {
            findingId: "chk-2",
            category: "Hygiene",
          },
        ],
      },
    } as RunDetail;

    const view = resolveFindingsSnapshotInsightDensityView(detail);

    expect(view.checklistCoverage[0]?.title).toBe("Checklist title was not stored.");
  });

  it("formatInsightDensityCurationMessage does not imply demotion when only findings were retained (FC-26)", () => {
    const message = formatInsightDensityCurationMessage({
      demotedToChecklistCount: 0,
      retainedFindingCount: 2,
    });

    expect(message).toContain("retained 2 decision-grade findings");
    expect(message).not.toContain("insight-density gate demotes");
    expect(message).toContain("without hiding checklist coverage");
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

  it("parses checklist severity without inventing a default label", () => {
    const view = resolveFindingsSnapshotInsightDensityView({
      run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" },
      findingsSnapshot: {
        checklistCoverage: [
          {
            findingId: "chk-sev",
            message: "Enable monitoring",
            severity: 2,
          },
        ],
      },
    } as RunDetail);

    expect(view.checklistCoverage[0]?.severityValue).toBe(2);
  });

  it("labels checklist rows without a stored title", () => {
    const view = resolveFindingsSnapshotInsightDensityView({
      run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" },
      findingsSnapshot: {
        checklistCoverage: [{ findingId: "chk-1" }],
      },
    } as never);

    expect(view.checklistCoverage[0]?.title).toBe("Checklist title was not stored.");
  });

  it("formatInsightDensityCurationMessage states when counts were not stored", () => {
    expect(formatInsightDensityCurationMessage({ demotedToChecklistCount: null, retainedFindingCount: null })).toBe(
      INSIGHT_DENSITY_CURATION_COUNTS_NOT_STORED,
    );
    expect(
      formatInsightDensityCurationMessage({
        demotedToChecklistCount: null,
        retainedFindingCount: 2,
      }),
    ).toBe(INSIGHT_DENSITY_CURATION_COUNTS_NOT_STORED);
    expect(
      formatInsightDensityCurationMessage({
        demotedToChecklistCount: 2,
        retainedFindingCount: null,
      }),
    ).toBe(INSIGHT_DENSITY_CURATION_COUNTS_NOT_STORED);
  });

  it("hasFindingsSnapshotInsightDensityContent is true for checklist rows or curation copy", () => {
    expect(
      hasFindingsSnapshotInsightDensityContent({
        checklistCoverage: [
          {
            findingId: "chk-1",
            title: "Enable monitoring",
            category: null,
            recommendation: null,
            severityValue: null,
          },
        ],
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
