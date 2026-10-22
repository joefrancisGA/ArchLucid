import { describe, expect, it } from "vitest";

import {
  isQuickScanAiSubmitAllowed,
  resolveQuickScanCapacityMessage,
} from "./quick-scan-capacity-state";
import type { QuickScanStatusResponse } from "./quick-scan-types";

describe("quick-scan-capacity-state", () => {
  it("maps sample-only status to plain language", () => {
    const status: QuickScanStatusResponse = {
      enabled: false,
      capacityAvailable: false,
      requireSignIn: false,
      sampleResultAvailable: true,
      capacityState: "SampleOnly",
      capacityStateMessage: "Quick Scan is in sample-only mode.",
    };

    expect(resolveQuickScanCapacityMessage(status)).toBe("Quick Scan is in sample-only mode.");
    expect(isQuickScanAiSubmitAllowed(status)).toBe(false);
  });

  it("allows submit only when capacity state is Available", () => {
    const status: QuickScanStatusResponse = {
      enabled: true,
      capacityAvailable: true,
      requireSignIn: false,
      sampleResultAvailable: true,
      capacityState: "Available",
    };

    expect(isQuickScanAiSubmitAllowed(status)).toBe(true);
  });
});
