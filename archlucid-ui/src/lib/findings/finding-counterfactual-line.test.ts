import { describe, expect, it } from "vitest";

import {
  extractCounterfactualFromFindingWire,
  extractCounterfactualFromQuickDecisionFinding,
  parseCounterfactualFromPrefixedText,
  parseCounterfactualFromTraceNotes,
} from "./finding-counterfactual-line";

describe("finding-counterfactual-line (DX-26)", () => {
  it("parses counterfactual notes from trace notes", () => {
    const line = parseCounterfactualFromTraceNotes([
      "evidence:graph-node:actor-1",
      "counterfactual:If checkout-func lost Contributor on kv-pay-prod, the write/admin path (2 hops) would be removed.",
    ]);

    expect(line).toBe(
      "If checkout-func lost Contributor on kv-pay-prod, the write/admin path (2 hops) would be removed.",
    );
  });

  it("parses counterfactual prefix from reasoningTrace wire field", () => {
    const line = parseCounterfactualFromPrefixedText(
      "counterfactual:If checkout-func lost Contributor on kv-pay-prod, the write/admin path (2 hops) would be removed.",
    );

    expect(line).toContain("write/admin path (2 hops)");
  });

  it("extracts counterfactual from quick decision finding recommendation", () => {
    const line = extractCounterfactualFromQuickDecisionFinding({
      recommendation:
        "counterfactual:If checkout-func lost Contributor on kv-pay-prod, the write/admin path (2 hops) would be removed.",
    });

    expect(line).toContain("kv-pay-prod");
  });

  it("extracts counterfactual from wireJson trace notes", () => {
    const line = extractCounterfactualFromQuickDecisionFinding({
      recommendation: "",
      aiReasoning: {
        wireJson: JSON.stringify({
          trace: {
            notes: [
              "counterfactual:If svc lost Owner on db-prod, the write/admin path (1 hops) would be removed.",
            ],
          },
        }),
      },
    });

    expect(line).toContain("db-prod");
  });

  it("returns null when counterfactual notes are absent", () => {
    expect(parseCounterfactualFromTraceNotes(["evidence:graph-node:a"])).toBeNull();
    expect(extractCounterfactualFromFindingWire({ reasoningTrace: "plain rationale" })).toBeNull();
  });
});
