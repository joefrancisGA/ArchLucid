import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
  isNextPublicDemoMode: () => true,
  isOperatorExperienceFullShellEnv: () => false,
}));

vi.mock("@/lib/operator/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: () => false,
}));

import {
  isCtoDemoExecutiveLandingEnv,
  isCtoDemoInternalOperatorControlsEnv,
  isCtoDemoNavExpandedEnv,
  isCtoDemoOperatorToolingEnv,
  isCtoDemoPackEnv,
  isCtoDemoPresenterSafeModeEnv,
} from "@/lib/cto-demo-presenter-pack";

describe("cto-demo-presenter-pack", () => {
  const prevNavExpanded = process.env.NEXT_PUBLIC_CTO_DEMO_NAV_EXPANDED;
  const prevOperatorControls = process.env.NEXT_PUBLIC_CTO_DEMO_OPERATOR_CONTROLS;
  const prevNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (prevNavExpanded === undefined) {
      delete process.env.NEXT_PUBLIC_CTO_DEMO_NAV_EXPANDED;
    } else {
      process.env.NEXT_PUBLIC_CTO_DEMO_NAV_EXPANDED = prevNavExpanded;
    }

    if (prevOperatorControls === undefined) {
      delete process.env.NEXT_PUBLIC_CTO_DEMO_OPERATOR_CONTROLS;
    } else {
      process.env.NEXT_PUBLIC_CTO_DEMO_OPERATOR_CONTROLS = prevOperatorControls;
    }

    if (prevNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = prevNodeEnv;
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

  it("hides operator tooling by default in packaged demo buyer-facing builds", () => {
    process.env.NODE_ENV = "test";
    delete process.env.NEXT_PUBLIC_CTO_DEMO_OPERATOR_CONTROLS;

    expect(isCtoDemoOperatorToolingEnv()).toBe(false);
  });

  it("enables operator tooling when NEXT_PUBLIC_CTO_DEMO_OPERATOR_CONTROLS is set", () => {
    process.env.NODE_ENV = "test";
    process.env.NEXT_PUBLIC_CTO_DEMO_OPERATOR_CONTROLS = "true";

    expect(isCtoDemoOperatorToolingEnv()).toBe(true);
    expect(isCtoDemoInternalOperatorControlsEnv()).toBe(true);
  });

  it("allows readiness recheck in development without exposing internal presenter controls", () => {
    process.env.NODE_ENV = "development";
    delete process.env.NEXT_PUBLIC_CTO_DEMO_OPERATOR_CONTROLS;

    expect(isCtoDemoOperatorToolingEnv()).toBe(true);
    expect(isCtoDemoInternalOperatorControlsEnv()).toBe(false);
  });
});
