import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ApplicationInsights } from "@microsoft/applicationinsights-web";

import { consumeRouteReferrer, stampRouteReferrer } from "@/lib/operator/operator-navigation-referrer";
import {
  resolveOperatorShellTelemetryMode,
  trackNavLinkClick,
  trackRouteEntered,
  trackUnlockPhaseChanged,
} from "@/lib/operator/operator-navigation-telemetry";
import { ensureAppInsights } from "@/lib/telemetry";

vi.mock("@/lib/telemetry", () => ({
  ensureAppInsights: vi.fn(),
}));

describe("operator-navigation-telemetry (IA-019)", () => {
  let trackEvent: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    window.sessionStorage.clear();
    trackEvent = vi.fn();
    vi.mocked(ensureAppInsights).mockResolvedValue({ trackEvent } as unknown as ApplicationInsights);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("resolves shell mode to a known telemetry bucket", () => {
    expect(["demo", "full-operator", "buyer-polished"]).toContain(resolveOperatorShellTelemetryMode());
  });

  it("stamps and consumes route referrers", () => {
    stampRouteReferrer("palette");
    expect(consumeRouteReferrer()).toBe("palette");
    expect(consumeRouteReferrer()).toBe("deep-link");
  });

  it("emits NavLinkClick with nav dimensions", async () => {
    trackNavLinkClick({
      href: "/governance/findings",
      group: "operate-governance",
      tier: "extended",
      unlockPhase: 1,
      shellMode: "buyer-polished",
    });

    await vi.waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith(
        { name: "NavLinkClick" },
        expect.objectContaining({
          href: "/governance/findings",
          group: "operate-governance",
          tier: "extended",
          unlockPhase: "1",
          shellMode: "buyer-polished",
        }),
      );
    });
  });

  it("emits RouteEntered with normalized route and referrer type", async () => {
    trackRouteEntered({
      pathname: "/architecture/reviews/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/findings",
      referrerType: "nav",
      shellMode: "demo",
    });

    await vi.waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith(
        { name: "RouteEntered" },
        expect.objectContaining({
          route: "/architecture/reviews/[reviewId]/findings",
          referrerType: "nav",
          shellMode: "demo",
        }),
      );
    });
  });

  it("emits UnlockPhaseChanged only when the phase moves", async () => {
    trackUnlockPhaseChanged({
      previousPhase: 0,
      newPhase: 0,
      reason: "persist",
    });

    expect(trackEvent).not.toHaveBeenCalled();

    trackUnlockPhaseChanged({
      previousPhase: 0,
      newPhase: 1,
      reason: "first-committed-review",
    });

    await vi.waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith(
        { name: "UnlockPhaseChanged" },
        expect.objectContaining({
          previousPhase: "0",
          newPhase: "1",
          reason: "first-committed-review",
        }),
      );
    });
  });
});
