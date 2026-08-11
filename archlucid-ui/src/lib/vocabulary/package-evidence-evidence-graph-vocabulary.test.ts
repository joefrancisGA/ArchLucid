import { describe, expect, it } from "vitest";

import {
  PACKAGE_EVIDENCE_EVIDENCE_GRAPH_COMPACT_LINE,
  PACKAGE_EVIDENCE_EVIDENCE_GRAPH_GRAPH_LINK,
  PACKAGE_EVIDENCE_EVIDENCE_GRAPH_HEADING,
  PACKAGE_EVIDENCE_EVIDENCE_GRAPH_REVIEWS_PEER_LINK,
  PACKAGE_EVIDENCE_EVIDENCE_GRAPH_WHY_TWO,
  buildPackageEvidenceEvidenceGraphVocabulary,
  resolvePackageEvidenceEvidenceGraphPeerLink,
} from "@/lib/vocabulary/package-evidence-evidence-graph-vocabulary";
import { buildArchitectureWorkspaceTabHref } from "@/lib/architecture-workspace-tabs";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import { REVIEWS_LIST_PATH } from "@/lib/architecture-routes";

describe("package-evidence-evidence-graph-vocabulary (TB-2300)", () => {
  it("explains package evidence capture vs evidence graph exploration", () => {
    const model = buildPackageEvidenceEvidenceGraphVocabulary("run-abc");

    expect(model.heading).toBe(PACKAGE_EVIDENCE_EVIDENCE_GRAPH_HEADING);
    expect(model.whyTwo).toBe(PACKAGE_EVIDENCE_EVIDENCE_GRAPH_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("capture");
    expect(model.whyTwo.toLowerCase()).toContain("graph");
    expect(model.compactLine).toBe(PACKAGE_EVIDENCE_EVIDENCE_GRAPH_COMPACT_LINE);
    expect(model.packageEvidenceLink.href).toBe(
      buildArchitectureWorkspaceTabHref("run-abc", "evidence"),
    );
    expect(model.evidenceGraphLink).toEqual(PACKAGE_EVIDENCE_EVIDENCE_GRAPH_GRAPH_LINK);
    expect(model.evidenceGraphLink.href).toBe(EVIDENCE_GRAPH_PATH);
  });

  it("uses Reviews hub peer when no runId is in scope", () => {
    const model = buildPackageEvidenceEvidenceGraphVocabulary();

    expect(model.packageEvidenceLink).toEqual(PACKAGE_EVIDENCE_EVIDENCE_GRAPH_REVIEWS_PEER_LINK);
    expect(model.packageEvidenceLink.href).toBe(REVIEWS_LIST_PATH);
  });

  it("builds reviewTab href when mounting on committed review Evidence", () => {
    const model = buildPackageEvidenceEvidenceGraphVocabulary("run-abc", "reviewTab");

    expect(model.packageEvidenceLink.href).toBe(buildReviewDetailTabHref("run-abc", "evidence"));
  });

  it("resolves the peer surface from package evidence and evidence graph", () => {
    const model = buildPackageEvidenceEvidenceGraphVocabulary("run-abc");

    expect(resolvePackageEvidenceEvidenceGraphPeerLink("package-evidence", model)).toEqual(
      model.evidenceGraphLink,
    );
    expect(resolvePackageEvidenceEvidenceGraphPeerLink("evidence-graph", model)).toEqual(
      model.packageEvidenceLink,
    );
  });
});
