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
} from "./review-chain-of-custody-display";

describe("review-chain-of-custody-display", () => {
  it("labels missing policy pack and version honestly", () => {
    expect(reviewChainOfCustodyPolicyPackAppliedLabel(null)).toBe(POLICY_PACK_WAS_NOT_STORED);
    expect(reviewChainOfCustodyPolicyPackAppliedLabel("cis-azure")).toBe("cis-azure");
    expect(reviewChainOfCustodyPolicyPackVersionLabel(null, null)).toBeNull();
    expect(reviewChainOfCustodyPolicyPackVersionLabel("soc2-pack", null)).toBe(
      POLICY_PACK_VERSION_WAS_NOT_STORED,
    );
    expect(reviewChainOfCustodyPolicyPackVersionLabel("soc2-pack", "2.1.0")).toBe("v2.1.0");
    expect(reviewChainOfCustodyPolicyPackVersionLabel("cis-azure", null)).toBe(
      POLICY_PACK_VERSION_WAS_NOT_STORED,
    );
  });

  it("labels missing trigger source without defaulting to Web UI", () => {
    expect(reviewChainOfCustodyTriggerSourceLabel(undefined)).toBe(TRIGGER_SOURCE_WAS_NOT_STORED);
    expect(reviewChainOfCustodyTriggerSourceLabel(null)).toBe(TRIGGER_SOURCE_WAS_NOT_STORED);
    expect(reviewChainOfCustodyTriggerSourceLabel("ui")).toBe("Web UI");
  });

  it("does not invent sealed time when manifest exists without completion timestamp", () => {
    expect(reviewChainOfCustodyPackageSealedLabel("manifest-1", null)).toBe(SEALED_TIME_WAS_NOT_STORED);
    expect(reviewChainOfCustodyPackageSealedLabel("manifest-1", "Apr 1, 2026, 12:00 UTC")).toBe(
      "Apr 1, 2026, 12:00 UTC",
    );
    expect(reviewChainOfCustodyPackageSealedLabel(null, null)).toBe("Not yet sealed");
  });
});
