import { describe, expect, it } from "vitest";

import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";

describe("comparePageHrefAdaptive", () => {
  it("uses buyer-polished friendly keys by default (TB-643)", () => {
    expect(process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE).toBe("operator");
    expect(comparePageHrefAdaptive("a", "b")).toBe("/insights/compare-two-reviews?priorRunId=a&laterRunId=b");
  });

  it("uses friendly labels when buyer-polished shell is active", () => {
    try {
      delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;
      delete process.env.NEXT_PUBLIC_DEMO_MODE;
      delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;

      expect(comparePageHrefAdaptive("prior", "later")).toBe("/insights/compare-two-reviews?priorRunId=prior&laterRunId=later");

      expect(comparePageHrefAdaptive("solo", undefined)).toBe("/insights/compare-two-reviews?priorRunId=solo");
    } finally {
      process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = "operator";
    }
  });
});
