import { describe, expect, it } from "vitest";

import {
  GRAPH_VIEW_MODEL_EXPORT_OPEN_REVIEW_DISCLAIMER,
  GRAPH_VIEW_MODEL_EXPORT_NODE_LABEL_NOT_STORED,
  GRAPH_VIEW_MODEL_EXPORT_RELATIONSHIP_TYPE_NOT_STORED,
  GRAPH_VIEW_MODEL_EXPORT_REVIEW_ID_FILENAME_SEGMENT,
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
    expect(mmd).toContain(GRAPH_VIEW_MODEL_EXPORT_OPEN_REVIEW_DISCLAIMER);
    expect(mmd).toContain('a_1["Alpha"]');
    expect(mmd).toContain(`-->|"relates.to"|`);
    expect(mmd).toContain("b_2");
  });

  it("uses omission copy for empty node labels and relationship types (P-01, P-02)", () => {
    const graph: GraphViewModel = {
      nodes: [{ id: "orphan-id", label: "   ", type: "Finding" }],
      edges: [{ source: "orphan-id", target: "orphan-id", type: "" }],
    };

    const mmd = graphViewModelToMermaidFlowchart(graph);

    expect(mmd).toContain(GRAPH_VIEW_MODEL_EXPORT_NODE_LABEL_NOT_STORED);
    expect(mmd).toContain(GRAPH_VIEW_MODEL_EXPORT_RELATIONSHIP_TYPE_NOT_STORED);
    expect(mmd).not.toContain("orphan-id");
    expect(mmd).not.toContain('"rel"');
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
    expect(json).toContain(GRAPH_VIEW_MODEL_EXPORT_OPEN_REVIEW_DISCLAIMER);
    expect(json).toContain('"runId": "run-1"');
    expect(json).toContain('"Alpha"');
  });

  it("normalizes empty labels and edge types in JSON export (P-01, P-02)", () => {
    const graph: GraphViewModel = {
      nodes: [{ id: "n-1", label: "", type: "Finding" }],
      edges: [{ source: "n-1", target: "n-1", type: "  " }],
    };

    const json = graphViewModelToJsonSnapshot(graph, {
      runId: "run-1",
      mode: "provenance-full",
      generatedAtUtc: "2026-05-08T12:00:00.000Z",
      typeFilterApplied: null,
    });

    expect(json).toContain(GRAPH_VIEW_MODEL_EXPORT_NODE_LABEL_NOT_STORED);
    expect(json).toContain(GRAPH_VIEW_MODEL_EXPORT_RELATIONSHIP_TYPE_NOT_STORED);
  });
});

describe("safeGraphExportFilenameSegment", () => {
  it("uses review-id omission segment when run id was not stored", () => {
    expect(safeGraphExportFilenameSegment("")).toBe(GRAPH_VIEW_MODEL_EXPORT_REVIEW_ID_FILENAME_SEGMENT);
    expect(safeGraphExportFilenameSegment("   ")).toBe(GRAPH_VIEW_MODEL_EXPORT_REVIEW_ID_FILENAME_SEGMENT);
  });

  it("normalizes unsafe characters", () => {
    expect(safeGraphExportFilenameSegment("claims/intake:v2")).toBe("claims_intake_v2");
  });
});
