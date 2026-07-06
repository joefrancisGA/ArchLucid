import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();
  return {
    ...actual,
  isBuyerPolishedOperatorShellEnv: () => true,
  isNextPublicDemoMode: () => true,
};
});

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
  const prevNavExpanded = process.env.NEXT_PUBLIC_CTO_DEMO_NAV_EXPANDED;

  afterEach(() => {
    if (prevNavExpanded === undefined) {
      delete process.env.NEXT_PUBLIC_CTO_DEMO_NAV_EXPANDED;
    } else {
      process.env.NEXT_PUBLIC_CTO_DEMO_NAV_EXPANDED = prevNavExpanded;
    }
  });

  it("enables packaged demo presenter features when demo mode is on", () => {
    expect(isCtoDemoPackEnv()).toBe(true);
    expect(isCtoDemoPresenterSafeModeEnv()).toBe(true);
    expect(isCtoDemoExecutiveLandingEnv()).toBe(true);
    expect(isCtoDemoNavExpandedEnv()).toBe(false);
  });

  it("expands CTO demo nav spine only when NEXT_PUBLIC_CTO_DEMO_NAV_EXPANDED is set", () => {
    process.env.NEXT_PUBLIC_CTO_DEMO_NAV_EXPANDED = "true";

    expect(isCtoDemoNavExpandedEnv()).toBe(true);
  });
});
