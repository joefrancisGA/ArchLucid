import { describe, expect, it } from "vitest";

import {
  findingWhyThisMattersText,
  typedPayloadLookupString,
} from "@/lib/finding-display-from-inspect";
import type { FindingInspectPayload } from "@/types/finding-inspect";

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
