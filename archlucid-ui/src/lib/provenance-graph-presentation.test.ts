import { describe, expect, it } from "vitest";

import { buildStaticDemoProvenanceGraphFromShowcase } from "@/lib/operator-static-demo";
import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import {
  applyBuyerLabelsToProvenanceGraphViewModel,
  buyerLabelForProvenanceNode,
} from "@/lib/provenance-graph-presentation";
import { provenanceLinkageToGraphViewModel } from "@/lib/provenance-linkage-to-graph-vm";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("provenance graph presentation", () => {
  it("maps coordinator types to business labels", () => {
    expect(buyerLabelForProvenanceNode("ArchitectureRun", "x")).toBe("Review kickoff");
    expect(buyerLabelForProvenanceNode("run", "Run 4d9da34ab1054765adac258037b9db08")).toBe("Review started");
    expect(buyerLabelForProvenanceNode("Unknown", "Fallback")).toBe("Fallback");
    expect(buyerLabelForProvenanceNode("Finding", "PHI minimization risk (monitored)")).toBe(
      "PHI minimization risk",
    );
  });

  it("keeps a meaningful system name on generic lifecycle nodes", () => {
    expect(buyerLabelForProvenanceNode("request", "Claims Intake Platform")).toBe("Claims Intake Platform");
    expect(buyerLabelForProvenanceNode("run", "Quarterly platform review")).toBe("Quarterly platform review");
  });

  it("falls back to the mapped label when a lifecycle name is an internal placeholder", () => {
    expect(buyerLabelForProvenanceNode("request", "ArchLucid")).toBe("Review request");
    expect(buyerLabelForProvenanceNode("request", "")).toBe("Review request");
  });

  it("keeps canonical product terms for signed-record types regardless of node name", () => {
    expect(buyerLabelForProvenanceNode("manifestVersion", "Manifest v1.0.0")).not.toContain("Manifest v1.0.0");
    expect(buyerLabelForProvenanceNode("goldenManifestPointer", "golden manifest ptr")).not.toMatch(/golden/i);
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
