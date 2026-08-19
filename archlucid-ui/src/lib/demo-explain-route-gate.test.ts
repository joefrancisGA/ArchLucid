import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getDemoExplainBuyerShellRedirectHref,
  shouldRedirectDemoExplainFromBuyerShell,
} from "@/lib/demo-explain-route-gate";
import { DEMO_EXPLAIN_BUYER_SHELL_REDIRECT_HREF } from "@/lib/demo-explain-page-copy";

vi.mock("@/lib/demo-ui-env", () => ({
  isOperatorExperienceFullShellEnv: vi.fn(() => false),
  isDemoStrictNavigationRedirectsBypassedForE2E: vi.fn(() => false),
}));

import {
  isDemoStrictNavigationRedirectsBypassedForE2E,
  isOperatorExperienceFullShellEnv,
} from "@/lib/demo-ui-env";

const fullShellMock = vi.mocked(isOperatorExperienceFullShellEnv);
const e2eBypassMock = vi.mocked(isDemoStrictNavigationRedirectsBypassedForE2E);

describe("demo-explain-route-gate (TB-1322)", () => {
  afterEach(() => {
    fullShellMock.mockReset();
    e2eBypassMock.mockReset();
    fullShellMock.mockReturnValue(false);
    e2eBypassMock.mockReturnValue(false);
  });

  it("redirects buyer-polished shells away from /demo/explain", () => {
    fullShellMock.mockReturnValue(false);
    e2eBypassMock.mockReturnValue(false);

    expect(shouldRedirectDemoExplainFromBuyerShell()).toBe(true);
  });

  it("allows full-operator shells to render the route", () => {
    fullShellMock.mockReturnValue(true);
    e2eBypassMock.mockReturnValue(false);

    expect(shouldRedirectDemoExplainFromBuyerShell()).toBe(false);
  });

  it("allows Playwright harness bypass to reach the route", () => {
    fullShellMock.mockReturnValue(false);
    e2eBypassMock.mockReturnValue(true);

    expect(shouldRedirectDemoExplainFromBuyerShell()).toBe(false);
  });

  it("uses /see-it as the buyer-shell redirect target", () => {
    expect(getDemoExplainBuyerShellRedirectHref()).toBe(DEMO_EXPLAIN_BUYER_SHELL_REDIRECT_HREF);
    expect(getDemoExplainBuyerShellRedirectHref()).toBe("/see-it");
  });
});
