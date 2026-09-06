import { describe, expect, it } from "vitest";

import {
  buildWithheldFindingDeepLink,
  formatStampCatalogEngineFailureHonestyLine,
  formatStampWithheldHonestyLine,
  formatWithheldFindingReasonLabel,
  resolveFindingsWithheldRows,
} from "@/lib/findings/findings-withheld-band";

describe("findings-withheld-band (DR-02)", () => {
  it("parses withheld rows from findingsSnapshot", () => {
    const rows = resolveFindingsWithheldRows({
      run: { runId: "run-1" },
      findingsSnapshot: {
        withheldFindings: [
          {
            withheldFindingId: "emission-r1-f1",
            reason: "prose-only-emission",
            originEngineType: "AgentArchitectureFinding-Compliance",
            originAgentType: "Compliance",
            title: "Unreferenced concern",
            traceTargetId: "result-1",
            conflictFindingId: null,
          },
        ],
      },
    } as never);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.reason).toBe("prose-only-emission");
    expect(formatWithheldFindingReasonLabel(rows[0]!.reason)).toContain("Prose-only");
  });

  it("builds merge-conflict deep links to finding inspect", () => {
    const href = buildWithheldFindingDeepLink("run-1", {
      withheldFindingId: "merge-drop-f2",
      reason: "merge-conflict-dropped",
      originEngineType: "zulu",
      originAgentType: null,
      title: "Dropped alternate",
      traceTargetId: null,
      conflictFindingId: "conflict-9",
    });

    expect(href).toContain("/findings/conflict-9");
  });

  it("formats stamp honesty line when count is positive", () => {
    expect(formatStampWithheldHonestyLine(2)).toContain("2 withheld");
    expect(formatStampWithheldHonestyLine(0)).toBeNull();
  });

  it("parses advisory engine failure withheld rows", () => {
    const rows = resolveFindingsWithheldRows({
      run: { runId: "run-1" },
      findingsSnapshot: {
        withheldFindings: [
          {
            withheldFindingId: "engine-failure-cost-constraint-cost",
            reason: "engine-failure-advisory",
            originEngineType: "cost-constraint",
            originAgentType: null,
            title: "This engine did not produce findings — the package is incomplete for Cost.",
            traceTargetId: null,
            conflictFindingId: null,
          },
        ],
      },
    } as never);

    expect(rows).toHaveLength(1);
    expect(formatWithheldFindingReasonLabel(rows[0]!.reason)).toContain("Engine did not run");
    expect(buildWithheldFindingDeepLink("run-1", rows[0]!)).toContain("reviewTab=findings");
  });

  it("formats catalog engine failure stamp honesty line", () => {
    expect(formatStampCatalogEngineFailureHonestyLine(1)).toContain("1 catalog engine failed");
    expect(formatStampCatalogEngineFailureHonestyLine(0)).toBeNull();
  });
});
