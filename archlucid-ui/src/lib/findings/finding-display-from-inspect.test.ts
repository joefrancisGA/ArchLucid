import { describe, expect, it } from "vitest";

import {
  findingDetailLeadSentence,
  findingDetailHeadingTitle,
  findingInspectNarrativeFields,
  findingWhyThisMattersText,
  phiMinimizationApprovalNarrative,
  phiMinimizationBuyerConsequenceNarrative,
  phiMinimizationRecommendedActionFallback,
  typedPayloadLookupString,
} from "@/lib/findings/finding-display-from-inspect";
import type { FindingInspectPayload } from "@/types/finding-inspect";

import { SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID } from "@/lib/showcase-static-demo";

function payloadWithTyped(data: Record<string, unknown>): FindingInspectPayload {
  return {
    findingId: "f-1",
    typedPayload: data,
    decisionRuleId: null,
    decisionRuleName: null,
    evidence: [],
    auditRowId: null,
    runId: "r-1",
    manifestVersion: null,
  };
}

describe("findingDetailHeadingTitle", () => {
  it("uses stored title for showcase finding id when title is present", () => {
    const payload: FindingInspectPayload = {
      ...payloadWithTyped({ title: "Some engine title" }),
      findingId: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
    };

    expect(findingDetailHeadingTitle(payload)).toBe("Some engine title");
  });

  it("uses canonical PHI title for showcase finding id when title is absent", () => {
    const payload: FindingInspectPayload = {
      ...payloadWithTyped({}),
      findingId: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
    };

    expect(findingDetailHeadingTitle(payload)).toBe("Sensitive Data Minimization Risk");
  });

  it("does not promote a rule id into the title", () => {
    const payload: FindingInspectPayload = {
      ...payloadWithTyped({}),
      decisionRuleId: "rule-123",
    };

    expect(findingDetailHeadingTitle(payload)).toBe("Finding title was not stored");
  });
});

describe("findingDetailLeadSentence", () => {
  it("uses omission copy when description is absent", () => {
    expect(findingDetailLeadSentence(payloadWithTyped({ impactedArea: "network" }))).toBe(
      "Finding description was not stored.",
    );
  });
});

describe("findingWhyThisMattersText", () => {
  it("reads camelCase and PascalCase keys", () => {
    expect(findingWhyThisMattersText(payloadWithTyped({ whyThisMatters: "Risk to members" }))).toBe("Risk to members");
    expect(findingWhyThisMattersText(payloadWithTyped({ WhyThisMatters: "Risk to members" }))).toBe("Risk to members");
  });

  it("does not reuse rationale or impact keys for why-this-matters", () => {
    expect(findingWhyThisMattersText(payloadWithTyped({ rationale: "Because PHI" }))).toBeNull();
    expect(findingWhyThisMattersText(payloadWithTyped({ businessImpact: "Compliance" }))).toBeNull();
  });

  it("returns null when absent", () => {
    expect(findingWhyThisMattersText(payloadWithTyped({ severity: "High" }))).toBeNull();
  });
});

describe("phi minimization sample copy (P-02–P-04)", () => {
  it("does not invent consequence, acceptance, or recommended action prose", () => {
    expect(phiMinimizationBuyerConsequenceNarrative()).toBe("Sample finding. A stored consequence was not stored.");
    expect(phiMinimizationBuyerConsequenceNarrative()).not.toContain("PHI");

    expect(phiMinimizationApprovalNarrative()).toBe("A stored acceptance was not stored on this finding.");
    expect(phiMinimizationApprovalNarrative()).not.toContain("Recorded acceptance");

    expect(phiMinimizationRecommendedActionFallback()).toBe("Recommended action was not stored.");
    expect(phiMinimizationRecommendedActionFallback()).not.toContain("privacy office");
  });
});

describe("findingInspectNarrativeFields (P-07)", () => {
  it("does not promote name or message into title and description", () => {
    const narrative = findingInspectNarrativeFields(
      payloadWithTyped({ name: "Agent title", message: "Agent message" }),
    );

    expect(narrative.title).toBeNull();
    expect(narrative.description).toBeNull();
  });
});

describe("typedPayloadLookupString", () => {
  it("returns null for non-object typedPayload", () => {
    const p: FindingInspectPayload = {
      findingId: "f-1",
      typedPayload: null,
      decisionRuleId: null,
      decisionRuleName: null,
      evidence: [],
      auditRowId: null,
      runId: "r-1",
      manifestVersion: null,
    };
    expect(typedPayloadLookupString(p, "whyThisMatters")).toBeNull();
  });
});
