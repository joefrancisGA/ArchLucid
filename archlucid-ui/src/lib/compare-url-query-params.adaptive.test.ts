import { describe, expect, it } from "vitest";

import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";

describe("comparePageHrefAdaptive", () => {
  it("tracks vitest.setup operator default (technical query keys)", () => {
    expect(process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE).toBe("operator");
    expect(comparePageHrefAdaptive("a", "b")).toBe("/compare?leftRunId=a&rightRunId=b");
  });

  it("uses friendly labels when buyer-polished shell is active", () => {
    try {
      delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;
      delete process.env.NEXT_PUBLIC_DEMO_MODE;
      delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;

      expect(comparePageHrefAdaptive("prior", "later")).toBe("/compare?priorRunId=prior&laterRunId=later");

      expect(comparePageHrefAdaptive("solo", undefined)).toBe("/compare?priorRunId=solo");
    } finally {
      process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = "operator";
    }
  });
});
