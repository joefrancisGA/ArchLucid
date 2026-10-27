import { describe, expect, it } from "vitest";

import {
  extractCounterfactualFromFindingWire,
  extractCounterfactualFromQuickDecisionFinding,
  FINDING_COUNTERFACTUAL_NOT_STORED,
  FINDING_COUNTERFACTUAL_STORED_EMPTY,
  parseCounterfactualFromPrefixedText,
  formatFindingCounterfactualPresentation,
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

  it("prefixes presentation copy so counterfactuals are not read as outcomes (P-07)", () => {
    expect(formatFindingCounterfactualPresentation("If svc lost access, the path would be removed.")).toBe(
      "Counterfactual, not a recorded outcome: If svc lost access, the path would be removed.",
    );
  });

  it("returns null when counterfactual notes are absent", () => {
    expect(parseCounterfactualFromTraceNotes(["evidence:graph-node:a"])).toBeNull();
    expect(extractCounterfactualFromFindingWire({ reasoningTrace: "plain rationale" })).toBeNull();
  });

  it("exposes not-stored copy for absent counterfactuals", () => {
    expect(FINDING_COUNTERFACTUAL_NOT_STORED).toBe("Counterfactual was not stored.");
  });

  it("returns stored-empty copy when counterfactual prefix has no body", () => {
    expect(parseCounterfactualFromTraceNotes(["counterfactual:"])).toBe(
      FINDING_COUNTERFACTUAL_STORED_EMPTY,
    );
    expect(parseCounterfactualFromPrefixedText("counterfactual:   ")).toBe(
      FINDING_COUNTERFACTUAL_STORED_EMPTY,
    );
  });
});
