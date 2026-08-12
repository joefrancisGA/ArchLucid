import { describe, expect, it } from "vitest";

import {
  findingDetailHeadingTitle,
  findingWhyThisMattersText,
  typedPayloadLookupString,
} from "@/lib/finding-display-from-inspect";
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

    expect(findingDetailHeadingTitle(payload)).toBe("PHI Minimization Risk");
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
