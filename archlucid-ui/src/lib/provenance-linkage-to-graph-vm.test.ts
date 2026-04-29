import { describe, expect, it } from "vitest";

import { provenanceLinkageToGraphViewModel } from "@/lib/provenance-linkage-to-graph-vm";
import { buildStaticDemoProvenanceGraphFromShowcase } from "@/lib/operator-static-demo";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("provenanceLinkageToGraphViewModel", () => {
  it("maps static demo provenance into GraphViewer nodes and edges", () => {
    const prov = buildStaticDemoProvenanceGraphFromShowcase(SHOWCASE_STATIC_DEMO_RUN_ID);
    const vm = provenanceLinkageToGraphViewModel(prov);

    expect(vm.nodes.length).toBeGreaterThan(0);
    expect(vm.edges.length).toBeGreaterThan(0);
    expect(vm.nodes[0]?.label.length).toBeGreaterThan(0);
    expect(vm.edges[0]?.source).toBeTruthy();
    expect(vm.edges[0]?.target).toBeTruthy();
  });
});
