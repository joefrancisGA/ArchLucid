import { describe, expect, it } from "vitest";

import {
  RUN_DETAIL_CREATE_HOME_EVIDENCE_DIAGRAM_CTA_LABEL,
  RUN_DETAIL_CREATE_HOME_EVIDENCE_DIAGRAM_NOT_STORED_HELPER,
  RUN_DETAIL_CREATE_HOME_EVIDENCE_GRAPH_SNAPSHOT_NOT_STORED_HELPER,
  resolveRunDetailCreateHomeEvidenceDiagramCrossLinkHelper,
} from "@/lib/runs/run-detail-create-home-evidence-copy";

describe("run-detail-create-home-evidence-copy", () => {
  it("uses distinct helpers for missing versus unknown graph snapshot", () => {
    expect(resolveRunDetailCreateHomeEvidenceDiagramCrossLinkHelper(false)).toBe(
      RUN_DETAIL_CREATE_HOME_EVIDENCE_DIAGRAM_NOT_STORED_HELPER,
    );
    expect(resolveRunDetailCreateHomeEvidenceDiagramCrossLinkHelper(undefined)).toBe(
      RUN_DETAIL_CREATE_HOME_EVIDENCE_GRAPH_SNAPSHOT_NOT_STORED_HELPER,
    );
  });

  it("labels the diagram cross-link CTA as Open diagram tab", () => {
    expect(RUN_DETAIL_CREATE_HOME_EVIDENCE_DIAGRAM_CTA_LABEL).toBe("Open diagram tab");
  });
});
