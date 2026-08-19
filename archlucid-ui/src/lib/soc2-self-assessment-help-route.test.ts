import { describe, expect, it } from "vitest";

import { SOC2_SELF_ASSESSMENT_HELP_PATH } from "@/lib/soc2-self-assessment-help-route";
import { SOC2_SELF_ASSESSMENT_HELP_ROUTE_METADATA } from "@/lib/soc2-self-assessment-help-route-metadata";

describe("soc2-self-assessment-help-route", () => {
  it("keeps the canonical path and buyer-safe metadata", () => {
    expect(SOC2_SELF_ASSESSMENT_HELP_PATH).toBe("/help/soc2-self-assessment");
    expect(SOC2_SELF_ASSESSMENT_HELP_ROUTE_METADATA.title).toBe("SOC 2 self-assessment");
    expect(String(SOC2_SELF_ASSESSMENT_HELP_ROUTE_METADATA.description ?? "").toLowerCase()).toContain(
      "not a cpa",
    );
  });
});
