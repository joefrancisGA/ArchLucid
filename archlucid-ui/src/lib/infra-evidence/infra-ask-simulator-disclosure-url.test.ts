import { describe, expect, it } from "vitest";

import {
  INFRA_ASK_SIMULATOR_PARAM,
  infraAskSimulatorModeHrefFromSearch,
  parseInfraAskSimulatorFromSearch,
} from "@/lib/infra-evidence/infra-ask-simulator-disclosure-url";

describe("infra-ask-simulator-disclosure-url simulator mode param", () => {
  it("parses explicit simulator mode values", () => {
    expect(parseInfraAskSimulatorFromSearch(null)).toBeNull();
    expect(parseInfraAskSimulatorFromSearch("1")).toBe(true);
    expect(parseInfraAskSimulatorFromSearch("0")).toBe(false);
    expect(parseInfraAskSimulatorFromSearch("false")).toBe(false);
  });

  it("writes simulator mode into shareable scoped links", () => {
    expect(
      infraAskSimulatorModeHrefFromSearch(
        "cloudResourceId=res-1",
        false,
        "/governance/infrastructure/ask",
      ),
    ).toBe(`/governance/infrastructure/ask?cloudResourceId=res-1&${INFRA_ASK_SIMULATOR_PARAM}=0`);
    expect(
      infraAskSimulatorModeHrefFromSearch(
        "cloudResourceId=res-1",
        true,
        "/governance/infrastructure/ask",
      ),
    ).toBe(`/governance/infrastructure/ask?cloudResourceId=res-1&${INFRA_ASK_SIMULATOR_PARAM}=1`);
  });
});
