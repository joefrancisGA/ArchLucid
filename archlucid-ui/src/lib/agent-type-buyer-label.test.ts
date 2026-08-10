import { describe, expect, it } from "vitest";

import { buyerLabelForAgentType } from "@/lib/agent-type-buyer-label";
import { ARCHITECTURE_STRUCTURE_BUYER_LABEL } from "@/lib/usability/canonical-product-terms";

describe("buyerLabelForAgentType", () => {
  it("maps Topology wire values to architecture structure", () => {
    expect(buyerLabelForAgentType("Topology")).toBe(ARCHITECTURE_STRUCTURE_BUYER_LABEL);
    expect(buyerLabelForAgentType(1)).toBe(ARCHITECTURE_STRUCTURE_BUYER_LABEL);
  });

  it("keeps other specialist labels", () => {
    expect(buyerLabelForAgentType("Cost")).toBe("Cost");
    expect(buyerLabelForAgentType("Compliance")).toBe("Compliance");
    expect(buyerLabelForAgentType("Critic")).toBe("Critic");
    expect(buyerLabelForAgentType(2)).toBe("Cost");
    expect(buyerLabelForAgentType(3)).toBe("Compliance");
    expect(buyerLabelForAgentType(4)).toBe("Critic");
  });

  it("handles blank and unknown values", () => {
    expect(buyerLabelForAgentType(null)).toBe("Agent (unknown)");
    expect(buyerLabelForAgentType("")).toBe("Agent (unknown)");
    expect(buyerLabelForAgentType("SecurityReviewer")).toBe("Agent (SecurityReviewer)");
    expect(buyerLabelForAgentType(99)).toBe("AgentType(99)");
  });
});
