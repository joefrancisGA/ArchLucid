import { describe, expect, it } from "vitest";

import { buildStaticDemoProvenanceGraphFromShowcase } from "@/lib/operator-static-demo";
import { policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import {
  applyBuyerLabelsToProvenanceGraphViewModel,
  buyerLabelForProvenanceNode,
} from "@/lib/provenance-graph-presentation";
import { provenanceLinkageToGraphViewModel } from "@/lib/provenance-linkage-to-graph-vm";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("provenance graph presentation", () => {
  it("maps coordinator types to business labels", () => {
    expect(buyerLabelForProvenanceNode("ArchitectureRun", "x")).toBe("Review kickoff");
    expect(buyerLabelForProvenanceNode("Unknown", "Fallback")).toBe("Fallback");
    expect(buyerLabelForProvenanceNode("Finding", "PHI minimization risk (monitored)")).toBe(
      "PHI minimization risk",
    );
  });

  it("rewrites static demo graph nodes for buyers", () => {
    const prov = buildStaticDemoProvenanceGraphFromShowcase(SHOWCASE_STATIC_DEMO_RUN_ID);
    const vm = provenanceLinkageToGraphViewModel(prov);
    const relabeled = applyBuyerLabelsToProvenanceGraphViewModel(vm);

    const runNode = relabeled.nodes.find((n) => n.id === "n-run");
    expect(runNode?.label).toBe("Review kickoff");

    const phi = relabeled.nodes.find((n) => n.id === "n-phi");
    expect(phi?.label).toBe("PHI minimization risk");
    expect(phi?.type).toBe("Finding");

    const policy = relabeled.nodes.find((n) => n.id === "n-policy");
    expect(policy?.type).toBe("PolicyPack");
    expect(policy?.label).toBe(policyPackBuyerLabel("healthcare-claims-v3", "3.4.1"));
  });
});
