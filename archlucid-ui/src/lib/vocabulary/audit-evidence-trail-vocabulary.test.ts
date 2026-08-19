import { describe, expect, it } from "vitest";

import {
  AUDIT_EVIDENCE_TRAIL_AUDIT_LINK,
  AUDIT_EVIDENCE_TRAIL_COMPACT_LINE,
  AUDIT_EVIDENCE_TRAIL_EVIDENCE_GRAPH_LINK,
  AUDIT_EVIDENCE_TRAIL_HEADING,
  AUDIT_EVIDENCE_TRAIL_SEARCH_EVIDENCE_LINK,
  AUDIT_EVIDENCE_TRAIL_WHY_THREE,
  buildAuditEvidenceTrailVocabulary,
  resolveAuditEvidenceTrailCurrentLink,
  resolveAuditEvidenceTrailPeerLinks,
} from "@/lib/vocabulary/audit-evidence-trail-vocabulary";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";

describe("audit-evidence-trail-vocabulary (TB-2255)", () => {
  it("explains audit activity log vs evidence trail surfaces and deep-links all three", () => {
    const model = buildAuditEvidenceTrailVocabulary();

    expect(model.heading).toBe(AUDIT_EVIDENCE_TRAIL_HEADING);
    expect(model.heading.toLowerCase()).toContain("audit");
    expect(model.heading.toLowerCase()).toContain("evidence");
    expect(model.whyThree).toBe(AUDIT_EVIDENCE_TRAIL_WHY_THREE);
    expect(model.whyThree.toLowerCase()).toContain("activity log");
    expect(model.whyThree.toLowerCase()).toContain("signed-record");
    expect(model.compactLine).toBe(AUDIT_EVIDENCE_TRAIL_COMPACT_LINE);

    expect(model.auditLink).toEqual(AUDIT_EVIDENCE_TRAIL_AUDIT_LINK);
    expect(model.auditLink.href).toBe(GOVERNANCE_AUDIT_PATH);
    expect(model.evidenceGraphLink).toEqual(AUDIT_EVIDENCE_TRAIL_EVIDENCE_GRAPH_LINK);
    expect(model.evidenceGraphLink.href).toBe(EVIDENCE_GRAPH_PATH);
    expect(model.searchEvidenceLink).toEqual(AUDIT_EVIDENCE_TRAIL_SEARCH_EVIDENCE_LINK);
    expect(model.searchEvidenceLink.href).toBe(SEARCH_REVIEW_EVIDENCE_PATH);
  });

  it("from audit links both evidence surfaces; from evidence links audit and the peer", () => {
    expect(resolveAuditEvidenceTrailPeerLinks("audit")).toEqual([
      AUDIT_EVIDENCE_TRAIL_EVIDENCE_GRAPH_LINK,
      AUDIT_EVIDENCE_TRAIL_SEARCH_EVIDENCE_LINK,
    ]);

    expect(resolveAuditEvidenceTrailPeerLinks("evidence-graph")).toEqual([
      AUDIT_EVIDENCE_TRAIL_AUDIT_LINK,
      AUDIT_EVIDENCE_TRAIL_SEARCH_EVIDENCE_LINK,
    ]);

    expect(resolveAuditEvidenceTrailPeerLinks("search-evidence")).toEqual([
      AUDIT_EVIDENCE_TRAIL_AUDIT_LINK,
      AUDIT_EVIDENCE_TRAIL_EVIDENCE_GRAPH_LINK,
    ]);
  });

  it("resolves the current surface link", () => {
    expect(resolveAuditEvidenceTrailCurrentLink("audit")).toEqual(AUDIT_EVIDENCE_TRAIL_AUDIT_LINK);
    expect(resolveAuditEvidenceTrailCurrentLink("evidence-graph")).toEqual(
      AUDIT_EVIDENCE_TRAIL_EVIDENCE_GRAPH_LINK,
    );
    expect(resolveAuditEvidenceTrailCurrentLink("search-evidence")).toEqual(
      AUDIT_EVIDENCE_TRAIL_SEARCH_EVIDENCE_LINK,
    );
  });
});
