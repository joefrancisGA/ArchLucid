import { describe, expect, it } from "vitest";

import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";

describe("comparePageHrefAdaptive", () => {
  it("uses technical keys when full operator shell is active (TB-643)", () => {
    expect(process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE).toBe("operator");
    expect(comparePageHrefAdaptive("a", "b")).toBe("/insights/compare-two-reviews?leftRunId=a&rightRunId=b");
  });

  it("uses technical keys when buyer-polished shell is active", () => {
    try {
      delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;
      delete process.env.NEXT_PUBLIC_DEMO_MODE;
      delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;

      expect(comparePageHrefAdaptive("prior", "later")).toBe(
        "/insights/compare-two-reviews?leftRunId=prior&rightRunId=later",
      );

      expect(comparePageHrefAdaptive("solo", undefined)).toBe("/insights/compare-two-reviews?leftRunId=solo");
    } finally {
      process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = "operator";
    }
  });
});
