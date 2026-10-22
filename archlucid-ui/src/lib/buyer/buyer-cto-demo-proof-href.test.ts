import { describe, expect, it } from "vitest";

import { buildCtoDemoProofHref } from "@/lib/buyer/buyer-cto-demo-proof-href";
import type { CtoDemoQuestion } from "@/lib/buyer/buyer-cto-demo-cto-questions";

const baseQuestion: CtoDemoQuestion = {
  id: "test",
  question: "Q?",
  answer: "A.",
  proofHref: "/trust",
  proofLabel: "Trust",
};

describe("buildCtoDemoProofHref", () => {
  it("returns proofHref unchanged when no query or fragment", () => {
    expect(buildCtoDemoProofHref(baseQuestion)).toBe("/trust");
  });

  it("appends query param with ?", () => {
    expect(
      buildCtoDemoProofHref({ ...baseQuestion, proofQueryParam: "focus=isolation" }),
    ).toBe("/trust?focus=isolation");
  });

  it("appends query param with & when href already has query", () => {
    expect(
      buildCtoDemoProofHref({
        ...baseQuestion,
        proofHref: "/audit?runId=x",
        proofQueryParam: "focus=api",
      }),
    ).toBe("/audit?runId=x&focus=api");
  });

  it("appends fragment after query", () => {
    expect(
      buildCtoDemoProofHref({
        ...baseQuestion,
        proofQueryParam: "focus=isolation",
        proofFragment: "isolation-section",
      }),
    ).toBe("/trust?focus=isolation#isolation-section");
  });
});
