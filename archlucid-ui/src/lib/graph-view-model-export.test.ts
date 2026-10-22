import { describe, expect, it } from "vitest";

import {
  graphViewModelToJsonSnapshot,
  graphViewModelToMermaidFlowchart,
  safeGraphExportFilenameSegment,
} from "@/lib/graph-view-model-export";
import type { GraphViewModel } from "@/types/graph";

const tinyGraph: GraphViewModel = {
  nodes: [
    { id: "a-1", label: "Alpha", type: "Context" },
    { id: "b_2", label: 'Beta "quoted"', type: "Finding" },
  ],
  edges: [{ source: "a-1", target: "b_2", type: "relates.to" }],
};

describe("graphViewModelToMermaidFlowchart", () => {
  it("declares nodes and directed edges with escaped labels", () => {
    const mmd = graphViewModelToMermaidFlowchart(tinyGraph);

    expect(mmd).toContain('flowchart LR');
    expect(mmd).toContain('a_1["Alpha"]');
    expect(mmd).toContain(`-->|"relates.to"|`);
    expect(mmd).toContain("b_2");
  });

  it("skips edges when an endpoint id is absent from nodes", () => {
    const orphan: GraphViewModel = {
      nodes: [{ id: "only", label: "Only", type: "X" }],
      edges: [{ source: "only", target: "missing", type: "x" }],
    };

    const mmd = graphViewModelToMermaidFlowchart(orphan);

    expect(mmd).not.toContain("-->");
  });
});

describe("graphViewModelToJsonSnapshot", () => {
  it("wraps nodes and edges with export metadata", () => {
    const json = graphViewModelToJsonSnapshot(tinyGraph, {
      runId: "run-1",
      mode: "provenance-full",
      generatedAtUtc: "2026-05-08T12:00:00.000Z",
      typeFilterApplied: null,
    });

    expect(json).toContain('"exportKind": "ArchLucid.GraphViewModel.v1"');
    expect(json).toContain('"runId": "run-1"');
    expect(json).toContain('"Alpha"');
  });
});

describe("safeGraphExportFilenameSegment", () => {
  it("normalizes unsafe characters", () => {
    expect(safeGraphExportFilenameSegment("claims/intake:v2")).toBe("claims_intake_v2");
  });
});
