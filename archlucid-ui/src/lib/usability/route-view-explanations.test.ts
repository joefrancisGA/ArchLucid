import { describe, expect, it } from "vitest";

import { GOVERNANCE_ALERTS_PATH } from "@/lib/governance-route-paths";
import { routeViewExplanationForPathname } from "@/lib/usability/route-view-explanations";

describe("routeViewExplanationForPathname (TB-2216)", () => {
  it("covers home, compare, alerts, and SSO hubs", () => {
    expect(routeViewExplanationForPathname("/")?.title).toBe("Home");
    expect(routeViewExplanationForPathname("/insights/compare-two-reviews")?.title).toBe("Compare two reviews");
    expect(routeViewExplanationForPathname(GOVERNANCE_ALERTS_PATH)?.title).toBe("Alerts");
    expect(routeViewExplanationForPathname("/alerts")?.title).toBe("Alerts");
    expect(routeViewExplanationForPathname("/administration/identity/sso-wizard")?.title).toBe("SSO wizard");
    expect(routeViewExplanationForPathname("/administration/identity-providers")?.title).toBe("SSO and identity");
    expect(routeViewExplanationForPathname("/administration/identity-providers/saml")?.title).toBe(
      "SSO and identity",
    );
  });

  it("keeps governance and evidence-graph null when headers own orientation", () => {
    expect(routeViewExplanationForPathname("/governance")).toBeNull();
    expect(routeViewExplanationForPathname("/governance/findings")).toBeNull();
    expect(routeViewExplanationForPathname("/governance/audit")).toBeNull();
    expect(routeViewExplanationForPathname("/insights/evidence-graph")).toBeNull();
  });

  it("does not treat nested paths as home", () => {
    expect(routeViewExplanationForPathname("/architecture/reviews")).toBeNull();
  });
});