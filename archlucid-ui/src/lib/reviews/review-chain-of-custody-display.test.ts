import { describe, expect, it } from "vitest";

import {
  POLICY_PACK_WAS_NOT_STORED,
  POLICY_PACK_VERSION_WAS_NOT_STORED,
  SEALED_TIME_WAS_NOT_STORED,
  TRIGGER_SOURCE_WAS_NOT_STORED,
  reviewChainOfCustodyPackageSealedLabel,
  reviewChainOfCustodyPolicyPackAppliedLabel,
  reviewChainOfCustodyPolicyPackVersionLabel,
  reviewChainOfCustodyTriggerSourceLabel,
} from "@/lib/reviews/review-chain-of-custody-display";

describe("review-chain-of-custody-display (P-05)", () => {
  it("uses not-stored labels for missing policy pack and trigger", () => {
    expect(reviewChainOfCustodyPolicyPackAppliedLabel(null)).toBe(POLICY_PACK_WAS_NOT_STORED);
    expect(reviewChainOfCustodyTriggerSourceLabel(null)).toBe(TRIGGER_SOURCE_WAS_NOT_STORED);
    expect(reviewChainOfCustodyTriggerSourceLabel(undefined)).toBe(TRIGGER_SOURCE_WAS_NOT_STORED);
  });

  it("labels known trigger source and policy pack without inventing defaults", () => {
    expect(reviewChainOfCustodyTriggerSourceLabel("ui")).toBe("Web UI");
    expect(reviewChainOfCustodyPolicyPackAppliedLabel("cis-azure")).toBe("cis-azure");
    expect(reviewChainOfCustodyPolicyPackVersionLabel("cis-azure", null)).toBe(
      POLICY_PACK_VERSION_WAS_NOT_STORED,
    );
  });

  it("uses sealed-time honesty when manifest exists without completed time", () => {
    expect(reviewChainOfCustodyPackageSealedLabel("manifest-1", null)).toBe(SEALED_TIME_WAS_NOT_STORED);
    expect(reviewChainOfCustodyPackageSealedLabel("manifest-1", "2026-01-02 00:00 UTC")).toBe(
      "2026-01-02 00:00 UTC",
    );
  });
});
