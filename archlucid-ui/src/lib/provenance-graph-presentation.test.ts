import { describe, expect, it } from "vitest";

import { buildStaticDemoProvenanceGraphFromShowcase } from "@/lib/operator-static-demo";
import {
  applyBuyerLabelsToProvenanceGraphViewModel,
  buyerLabelForProvenanceNode,
} from "@/lib/provenance-graph-presentation";
import { provenanceLinkageToGraphViewModel } from "@/lib/provenance-linkage-to-graph-vm";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("provenance graph presentation", () => {
  it("maps coordinator types to business labels", () => {
    expect(buyerLabelForProvenanceNode("ArchitectureRun", "x")).toBe("Review started");
    expect(buyerLabelForProvenanceNode("Unknown", "Fallback")).toBe("Fallback");
  });

  it("rewrites static demo graph nodes for buyers", () => {
    const prov = buildStaticDemoProvenanceGraphFromShowcase(SHOWCASE_STATIC_DEMO_RUN_ID);
    const vm = provenanceLinkageToGraphViewModel(prov);
    const relabeled = applyBuyerLabelsToProvenanceGraphViewModel(vm);

    const runNode = relabeled.nodes.find((n) => n.id === "n-run");
    expect(runNode?.label).toBe("Review started");

    const phi = relabeled.nodes.find((n) => n.id === "n-phi");
    expect(phi?.label).toBe("PHI minimization risk");
    expect(phi?.type).toBe("Finding");
  });
});
