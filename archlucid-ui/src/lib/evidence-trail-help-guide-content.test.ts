import { describe, expect, it } from "vitest";

import {
  EVIDENCE_TRAIL_HELP_DIAGRAM_SOURCE,
  EVIDENCE_TRAIL_HELP_DIAGRAM_SUMMARY,
  EVIDENCE_TRAIL_HELP_FINDING_GRAPH_ACTION,
  EVIDENCE_TRAIL_HELP_FINDING_TRACE_ACTION,
  EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS,
  EVIDENCE_TRAIL_HELP_RELATED_GUIDES,
} from "@/lib/evidence-trail-help-guide-content";
import { AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL } from "@/lib/empty-state-presets";
import { BUYER_EVIDENCE_TRAIL_LOAD_BUTTON } from "@/lib/buyer/buyer-polish-copy";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import {
  FINDING_EVIDENCE_GRAPH_DEFAULT_MODE,
  SHIPPED_EVIDENCE_GRAPH_MODES,
} from "@/lib/graph-finding-deep-links";

describe("evidence-trail-help-guide-content", () => {
  it("ships a buyer-safe provenance diagram (TB-2127)", () => {
    expect(EVIDENCE_TRAIL_HELP_DIAGRAM_SUMMARY.length).toBeGreaterThan(40);
    expect(EVIDENCE_TRAIL_HELP_DIAGRAM_SOURCE).toContain("flowchart LR");
    expect(EVIDENCE_TRAIL_HELP_DIAGRAM_SOURCE).toContain("Evidence graph");
    expect(EVIDENCE_TRAIL_HELP_DIAGRAM_SOURCE).not.toContain("ContextSnapshot");
  });

  it("exposes Open graph, Load, and sample CTAs with shipped buyer labels (TB-1364)", () => {
    expect(EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.openGraph.href).toBe(EVIDENCE_GRAPH_PATH);
    expect(EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.loadGraph.label).toBe(BUYER_EVIDENCE_TRAIL_LOAD_BUTTON);
    expect(EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.openSampleGraph.label).toBe(
      AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL,
    );
    expect(EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.openSampleGraph.href).toContain("runId=");
    expect(EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.openSampleGraph.href).toContain(
      `mode=${FINDING_EVIDENCE_GRAPH_DEFAULT_MODE}`,
    );
  });

  it("aligns finding trace and graph deep links with shipped graph modes (TB-1361)", () => {
    expect(EVIDENCE_TRAIL_HELP_FINDING_TRACE_ACTION.href).toContain("/evidence-trace");
    expect(EVIDENCE_TRAIL_HELP_FINDING_TRACE_ACTION.href).not.toContain("review-trail");
    expect(EVIDENCE_TRAIL_HELP_FINDING_GRAPH_ACTION.mode).toBe("provenance-full");
    expect(SHIPPED_EVIDENCE_GRAPH_MODES).toContain(EVIDENCE_TRAIL_HELP_FINDING_GRAPH_ACTION.mode);
    expect(EVIDENCE_TRAIL_HELP_FINDING_GRAPH_ACTION.href).toContain("mode=provenance-full");
    expect(EVIDENCE_TRAIL_HELP_FINDING_GRAPH_ACTION.href).not.toContain("review-trail");
  });

  it("lists at most three in-app related guides (TB-1362)", () => {
    expect(EVIDENCE_TRAIL_HELP_RELATED_GUIDES.length).toBeLessThanOrEqual(3);
    expect(EVIDENCE_TRAIL_HELP_RELATED_GUIDES.every((link) => link.href.startsWith("/help/"))).toBe(true);
  });
});
