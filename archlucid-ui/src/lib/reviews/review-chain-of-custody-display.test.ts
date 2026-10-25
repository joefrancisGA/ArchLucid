import { describe, expect, it } from "vitest";

import {
  POLICY_PACK_WAS_NOT_STORED,
  SEALED_TIME_WAS_NOT_STORED,
  TRIGGER_WAS_NOT_STORED,
  reviewChainOfCustodyPackageSealedLabel,
  reviewChainOfCustodyPolicyPackAppliedLabel,
  reviewChainOfCustodyTriggerSourceLabel,
} from "@/lib/reviews/review-chain-of-custody-display";

describe("review-chain-of-custody-display", () => {
  it("uses not-stored labels for missing policy pack and trigger", () => {
    expect(reviewChainOfCustodyPolicyPackAppliedLabel(null, null)).toBe(POLICY_PACK_WAS_NOT_STORED);
    expect(reviewChainOfCustodyTriggerSourceLabel(null)).toBe(TRIGGER_WAS_NOT_STORED);
  });

  it("uses sealed-time honesty when manifest exists without completed time", () => {
    expect(reviewChainOfCustodyPackageSealedLabel("manifest-1", null)).toBe(SEALED_TIME_WAS_NOT_STORED);
  });
});
