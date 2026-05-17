import { describe, expect, it } from "vitest";

import { citationKindBuyerLabel } from "@/lib/citation-kind-buyer-label";

describe("citationKindBuyerLabel", () => {
  it("maps internal citation kinds to buyer-facing chip labels", () => {
    expect(citationKindBuyerLabel("GraphSnapshot")).toBe("Decision traceability graph");
    expect(citationKindBuyerLabel("ContextSnapshot")).toBe("Reviewed source context");
    expect(citationKindBuyerLabel("DecisionTrace")).toBe("Decision record");
    expect(citationKindBuyerLabel("Manifest")).toBe("Signed manifest");
  });
});
