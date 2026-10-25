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
  it("labels omitted trigger source without defaulting to Web UI", () => {
    expect(reviewChainOfCustodyTriggerSourceLabel(undefined)).toBe(TRIGGER_SOURCE_WAS_NOT_STORED);
    expect(reviewChainOfCustodyTriggerSourceLabel("ui")).toBe("Web UI");
  });

  it("labels omitted policy pack without inventing a default pack name", () => {
    expect(reviewChainOfCustodyPolicyPackAppliedLabel(null)).toBe(POLICY_PACK_WAS_NOT_STORED);
    expect(reviewChainOfCustodyPolicyPackAppliedLabel("cis-azure")).toBe("cis-azure");
    expect(reviewChainOfCustodyPolicyPackVersionLabel("cis-azure", null)).toBe(
      POLICY_PACK_VERSION_WAS_NOT_STORED,
    );
  });

  it("does not treat analysis completion as seal time when seal timestamp is missing", () => {
    expect(reviewChainOfCustodyPackageSealedLabel("manifest-1", null)).toBe(SEALED_TIME_WAS_NOT_STORED);
    expect(reviewChainOfCustodyPackageSealedLabel("manifest-1", "2026-01-02 00:00 UTC")).toBe(
      "2026-01-02 00:00 UTC",
    );
  });
});
