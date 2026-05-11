import { describe, expect, it } from "vitest";

import { citationKindBuyerLabel } from "@/lib/citation-kind-buyer-label";

describe("citationKindBuyerLabel", () => {
  it("maps internal citation kinds to buyer-facing chip labels", () => {
    expect(citationKindBuyerLabel("GraphSnapshot")).toBe("Evidence-to-decision graph");
    expect(citationKindBuyerLabel("ContextSnapshot")).toBe("Context snapshot");
    expect(citationKindBuyerLabel("DecisionTrace")).toBe("Decision record");
    expect(citationKindBuyerLabel("Manifest")).toBe("Reviewed manifest");
  });
});
