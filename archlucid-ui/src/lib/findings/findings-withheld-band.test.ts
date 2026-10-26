import { describe, expect, it } from "vitest";

import {
  buildWithheldFindingDeepLink,
  formatWithheldFindingOpenLinkLabel,
  formatStampCatalogEngineFailureHonestyLine,
  formatStampWithheldHonestyLine,
  formatWithheldFindingReasonLabel,
  resolveFindingsWithheldRows,
  describeFindingsWithheldListLoadState,
  FINDINGS_WITHHELD_LIST_NOT_STORED_LABEL,
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
    expect(rows[0]?.reasonDisplay).toContain("Prose-only");
    expect(formatWithheldFindingReasonLabel(rows[0]!.reason)).toContain("Prose-only");
  });

  it("labels engine-failure rows without trace targets honestly", () => {
    expect(
      formatWithheldFindingOpenLinkLabel({
        withheldFindingId: "engine-failure-cost-constraint-cost",
        reason: "engine-failure-advisory",
        reasonDisplay: "Engine did not run (advisory failure)",
        originEngineType: "CostConstraint",
        originAgentType: null,
        title: "Engine failure",
        traceTargetId: null,
        conflictFindingId: null,
      }),
    ).toBe("Open findings. A trace target was not stored.");
  });

  it("builds merge-conflict deep links to finding inspect", () => {
    const href = buildWithheldFindingDeepLink("run-1", {
      withheldFindingId: "merge-drop-f2",
      reason: "merge-conflict-dropped",
      reasonDisplay: "Merge conflict (alternate payload withheld)",
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
    expect(formatStampWithheldHonestyLine(undefined)).toBe(
      "Withheld finding count was not stored.",
    );
    expect(formatStampCatalogEngineFailureHonestyLine(undefined)).toBe(
      "Catalog engine failure count was not stored.",
    );
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

  it("labels withheld reason and title when omitted on the wire", () => {
    const rows = resolveFindingsWithheldRows({
      run: { runId: "run-1" },
      findingsSnapshot: {
        withheldFindings: [
          {
            withheldFindingId: "missing-reason",
            originEngineType: "cost-constraint",
            title: "",
          },
        ],
      },
    } as never);

    expect(rows[0]?.reasonDisplay).toBe("Withheld reason was not stored.");
    expect(rows[0]?.title).toBe("Finding title was not stored.");
  });

  it("labels a missing origin engine explicitly", () => {
    const rows = resolveFindingsWithheldRows({
      run: { runId: "run-1" },
      findingsSnapshot: {
        withheldFindings: [
          {
            withheldFindingId: "missing-engine",
            reason: "prose-only-emission",
            title: "Missing engine",
          },
        ],
      },
    } as never);

    expect(rows[0]?.originEngineType).toBe("Origin engine was not stored.");
  });

  it("parses compliance tag prose quarantine rows", () => {
    const rows = resolveFindingsWithheldRows({
      run: { runId: "run-1" },
      findingsSnapshot: {
        withheldFindings: [
          {
            withheldFindingId: "compliance-tag-prose-r1-f1",
            reason: "compliance-tag-from-prose",
            originEngineType: "AgentArchitectureFinding-Compliance",
            originAgentType: "Compliance",
            title: "SOC 2",
            traceTargetId: "result-1",
            conflictFindingId: null,
          },
        ],
      },
    } as never);

    expect(rows).toHaveLength(1);
    expect(formatWithheldFindingReasonLabel(rows[0]!.reason)).toContain("Compliance tag from prose");
  });

  it("labels omitted withheldFindings arrays when snapshot exists (P-16)", () => {
    expect(
      describeFindingsWithheldListLoadState({
        run: { runId: "run-1" },
        findingsSnapshot: {},
      } as never),
    ).toBe(FINDINGS_WITHHELD_LIST_NOT_STORED_LABEL);
  });

  it("formats catalog engine failure stamp honesty line", () => {
    expect(formatStampCatalogEngineFailureHonestyLine(1)).toContain("1 catalog engine failed");
    expect(formatStampCatalogEngineFailureHonestyLine(0)).toBeNull();
  });
});
