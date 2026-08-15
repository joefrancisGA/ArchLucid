import { describe, expect, it } from "vitest";

import {
  buildSourceEvidenceLinksFromInspect,
  buildSourceEvidenceLinksFromInspectEvidence,
  linksIncludeManifestSection,
  parseEvidenceRefToSourceLink,
  primaryFindingEvidenceNavigationHref,
  runDetailSectionHref,
} from "@/lib/findings/finding-source-evidence-links";
import { buildStaticDemoPrimaryFindingInspectPayload } from "@/lib/operator/operator-static-demo";
import {
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
import type { FindingInspectPayload } from "@/types/finding-inspect";

describe("finding-source-evidence-links", () => {
  const ctx = {
    runId: SHOWCASE_STATIC_DEMO_RUN_ID,
    findingId: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
    manifestId: SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  };

  it("maps showcase inspect evidence rows to manifest and graph anchors", () => {
    const payload = buildStaticDemoPrimaryFindingInspectPayload(SHOWCASE_STATIC_DEMO_RUN_ID);
    const links = buildSourceEvidenceLinksFromInspect(ctx, payload);

    expect(links.length).toBeGreaterThanOrEqual(3);
    expect(links[0]?.kind).toBe("manifestSection");
    expect(links[0]?.href).toBe(runDetailSectionHref(SHOWCASE_STATIC_DEMO_RUN_ID, "manifest-summary"));
    expect(links[1]?.kind).toBe("graphNode");
    expect(links[1]?.href).toContain("/insights/evidence-graph?runId=");
    expect(linksIncludeManifestSection(links)).toBe(true);
  });

  it("prefers manifest section for primary navigation chip", () => {
    const payload = buildStaticDemoPrimaryFindingInspectPayload(SHOWCASE_STATIC_DEMO_RUN_ID);
    const links = buildSourceEvidenceLinksFromInspect(ctx, payload);
    const primary = primaryFindingEvidenceNavigationHref(links);

    expect(primary).toBe(runDetailSectionHref(SHOWCASE_STATIC_DEMO_RUN_ID, "manifest-summary"));
  });

  it("parses manifest-prefixed evidence refs", () => {
    const link = parseEvidenceRefToSourceLink(`manifest:${SHOWCASE_STATIC_DEMO_MANIFEST_ID}`, ctx);

    expect(link?.kind).toBe("manifestRecord");
    expect(link?.href).toContain(`/governance/sealed-records/${SHOWCASE_STATIC_DEMO_MANIFEST_ID}#manifest-decisions`);
  });

  it("buildSourceEvidenceLinksFromInspectEvidence honors artifact section anchors", () => {
    const link = buildSourceEvidenceLinksFromInspectEvidence(
      { runId: "run-other", findingId: "finding-x" },
      {
        artifactId: "network-topology.json",
        lineRange: "10-20",
        excerpt: "Subnet allows public ingress.",
      },
      0,
    );

    expect(link.kind).toBe("artifactSection");
    expect(link.href).toBe(runDetailSectionHref("run-other", "artifacts-exports"));
    expect(link.detail).toContain("Lines 10-20");
  });

  it("returns inspect-equivalent links for empty evidence payloads", () => {
    const emptyPayload: FindingInspectPayload = {
      findingId: "f-1",
      typedPayload: null,
      decisionRuleId: null,
      decisionRuleName: null,
      evidence: [],
      recommendedActions: [],
      auditRowId: null,
      runId: "run-1",
      manifestVersion: null,
    };

    expect(buildSourceEvidenceLinksFromInspect({ runId: "run-1", findingId: "f-1" }, emptyPayload)).toEqual([]);
  });
});
