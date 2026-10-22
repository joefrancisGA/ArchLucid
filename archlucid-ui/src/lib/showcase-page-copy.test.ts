import { describe, expect, it } from "vitest";

import {
  SHOWCASE_HERO_SUBTITLE,
  SHOWCASE_HERO_SUBTITLE_BUYER,
  SHOWCASE_HERO_SUBTITLE_OPERATOR,
  showcaseTitleForRunId,
} from "@/lib/showcase-page-copy";
import { CUSTOMER_INTAKE_SAMPLE_RUN_ID } from "@/lib/samples/customer-intake-modernization/definition";

describe("showcase-page-copy", () => {
  it("uses the shorter buyer hero subtitle", () => {
    expect(SHOWCASE_HERO_SUBTITLE).toBe(SHOWCASE_HERO_SUBTITLE_BUYER);
    expect(SHOWCASE_HERO_SUBTITLE_BUYER.length).toBeLessThan(SHOWCASE_HERO_SUBTITLE_OPERATOR.length);
  });

  it("resolves curated showcase titles", () => {
    expect(showcaseTitleForRunId(CUSTOMER_INTAKE_SAMPLE_RUN_ID)).toContain("Enterprise Customer Intake");
  });

  it("does not throw when run id has malformed percent encoding", () => {
    expect(() => showcaseTitleForRunId("%")).not.toThrow();
    expect(showcaseTitleForRunId("%")).toBe("Completed example (%)");
  });
});
