import { describe, expect, it } from "vitest";

import {
  findingInspectListsEvidenceProvenance,
  graphEvidenceHrefFromInspect,
  preferredGraphNodeIdForFindingDeepLink,
  SHOWCASE_PHI_FINDING_GRAPH_NODE_ID,
} from "@/lib/finding-inspect-graph-evidence";
import { SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { FindingInspectPayload } from "@/types/finding-inspect";

const minimalInspect = (overrides: Partial<FindingInspectPayload>): FindingInspectPayload => ({
  findingId: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  typedPayload: {},
  decisionRuleId: null,
  decisionRuleName: null,
  evidence: [],
  recommendedActions: [],
  auditRowId: null,
  runId: SHOWCASE_STATIC_DEMO_RUN_ID,
  manifestVersion: null,
  ...overrides,
});

describe("finding-inspect-graph-evidence", () => {
  it("detects provenance when inspect lists an excerpt", () => {
    expect(
      findingInspectListsEvidenceProvenance(
        minimalInspect({
          evidence: [{ artifactId: null, lineRange: null, excerpt: "hello" }],
        }),
      ),
    ).toBe(true);
  });

  it("returns null graph href when inspect evidence is empty", () => {
    expect(
      graphEvidenceHrefFromInspect(
        SHOWCASE_STATIC_DEMO_RUN_ID,
        SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
        minimalInspect({ evidence: [] }),
      ),
    ).toBeNull();
  });

  it("builds graph deep link with demo PHI focus node", () => {
    const href = graphEvidenceHrefFromInspect(
      SHOWCASE_STATIC_DEMO_RUN_ID,
      SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
      minimalInspect({
        evidence: [{ artifactId: null, lineRange: null, excerpt: "x" }],
      }),
    );

    expect(href).toContain(`runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`);
    expect(href).toContain(`graphNodeId=${SHOWCASE_PHI_FINDING_GRAPH_NODE_ID}`);
  });

  it("resolves preferred graph node id for slugged showcase finding ids", () => {
    expect(preferredGraphNodeIdForFindingDeepLink(SHOWCASE_STATIC_DEMO_RUN_ID, `${SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID}-abc`)).toBe(
      SHOWCASE_PHI_FINDING_GRAPH_NODE_ID,
    );
  });
});
