import { describe, expect, it } from "vitest";

import {
  findingDetailLeadSentence,
  findingDetailHeadingTitle,
  findingWhyThisMattersText,
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
  it("uses canonical PHI title for showcase finding id", () => {
    const payload: FindingInspectPayload = {
      ...payloadWithTyped({ title: "Some engine title" }),
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

  it("falls back to rationale and impact keys", () => {
    expect(findingWhyThisMattersText(payloadWithTyped({ rationale: "Because PHI" }))).toBe("Because PHI");
    expect(findingWhyThisMattersText(payloadWithTyped({ businessImpact: "Compliance" }))).toBe("Compliance");
  });

  it("returns null when absent", () => {
    expect(findingWhyThisMattersText(payloadWithTyped({ severity: "High" }))).toBeNull();
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
