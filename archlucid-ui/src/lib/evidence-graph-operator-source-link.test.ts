import { describe, expect, it } from "vitest";

import {
  EVIDENCE_GRAPH_OPEN_ACTION_LABEL,
  EVIDENCE_GRAPH_OPERATOR_SOURCE_LINK,
} from "@/lib/evidence-graph-operator-source-link";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";

describe("evidence-graph-operator-source-link (PC-12)", () => {
  it("uses the canonical Evidence graph label for operator source rows", () => {
    expect(EVIDENCE_GRAPH_OPERATOR_SOURCE_LINK).toEqual({
      label: BUYER_SURFACE_VOCABULARY.evidenceGraph,
      href: EVIDENCE_GRAPH_PATH,
    });
  });

  it("uses graph wording for deep-link action labels", () => {
    expect(EVIDENCE_GRAPH_OPEN_ACTION_LABEL).toBe("Open evidence graph");
  });
});
