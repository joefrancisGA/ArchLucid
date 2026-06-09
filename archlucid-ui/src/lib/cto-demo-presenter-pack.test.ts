import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
  isNextPublicDemoMode: () => true,
}));

vi.mock("@/lib/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: () => false,
}));

import {
  isCtoDemoExecutiveLandingEnv,
  isCtoDemoNavExpandedEnv,
  isCtoDemoPackEnv,
  isCtoDemoPresenterSafeModeEnv,
} from "@/lib/cto-demo-presenter-pack";

describe("cto-demo-presenter-pack", () => {
  it("enables packaged demo presenter features when demo mode is on", () => {
    expect(isCtoDemoPackEnv()).toBe(true);
    expect(isCtoDemoPresenterSafeModeEnv()).toBe(true);
    expect(isCtoDemoExecutiveLandingEnv()).toBe(true);
    expect(isCtoDemoNavExpandedEnv()).toBe(true);
  });
});
