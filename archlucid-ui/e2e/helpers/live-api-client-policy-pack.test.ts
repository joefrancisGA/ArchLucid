import { describe, expect, it } from "vitest";

import {
  LIVE_E2E_MINIMAL_POLICY_PACK_ADVISORY_DEFAULTS,
  minimalPolicyPackContentJson,
} from "./live-api-client";

describe("live-api-client policy pack helpers", () => {
  it("seeds advisoryDefaults on minimal live-e2e policy pack content", () => {
    const parsed = JSON.parse(minimalPolicyPackContentJson("sec-base-001")) as {
      advisoryDefaults?: Record<string, string>;
      complianceRuleKeys?: string[];
    };

    expect(parsed.complianceRuleKeys).toEqual(["sec-base-001"]);
    expect(parsed.advisoryDefaults).toEqual(LIVE_E2E_MINIMAL_POLICY_PACK_ADVISORY_DEFAULTS);
    expect(parsed.advisoryDefaults?.priorityFloor).toBe("P0");
  });
});
