import { describe, expect, it } from "vitest";

import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture-routes";
import { SETTINGS_BILLING_PATH } from "@/lib/billing-and-plans-help-route";
import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import { GOVERNANCE_ALERTS_PATH, GOVERNANCE_EXCEPTIONS_PATH } from "@/lib/governance-route-paths";
import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";
import { routeViewExplanationForPathname } from "@/lib/usability/route-view-explanations";

describe("routeViewExplanationForPathname (TB-2216 / TB-2257)", () => {
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

  it("covers TB-2257 explain-this-view expansions with buyer nouns", () => {
    const exceptions = routeViewExplanationForPathname(GOVERNANCE_EXCEPTIONS_PATH);
    expect(exceptions?.title).toBe("Exceptions");
    expect(exceptions?.summary.toLowerCase()).toContain("risk exception");
    expect(exceptions?.nextAction.toLowerCase()).toContain("exception");

    const digests = routeViewExplanationForPathname(DIGESTS_HUB_PATH);
    expect(digests?.title).toBe("Digests");
    expect(digests?.summary.toLowerCase()).toContain("digest");
    expect(digests?.summary.toLowerCase()).toContain("content cadence");

    const aiUsage = routeViewExplanationForPathname(AI_USAGE_SETTINGS_PATH);
    expect(aiUsage?.title).toBe("AI usage");
    expect(aiUsage?.summary.toLowerCase()).toContain("budget");

    const billing = routeViewExplanationForPathname(SETTINGS_BILLING_PATH);
    expect(billing?.title).toBe("Billing & plans");
    expect(billing?.summary.toLowerCase()).toContain("plan");

    const impact = routeViewExplanationForPathname(IMPACT_PREVIEW_PATH);
    expect(impact?.title).toBe("Impact preview");
    expect(impact?.summary.toLowerCase()).toContain("architecture");

    const architectures = routeViewExplanationForPathname(ARCHITECTURES_LIST_PATH);
    expect(architectures?.title).toBe("Architecture drafts");
    expect(architectures?.summary.toLowerCase()).toContain("draft");
  });

  it("keeps other governance and evidence-graph null when headers own orientation", () => {
    expect(routeViewExplanationForPathname("/governance")).toBeNull();
    expect(routeViewExplanationForPathname("/governance/findings")).toBeNull();
    expect(routeViewExplanationForPathname("/governance/audit")).toBeNull();
    expect(routeViewExplanationForPathname("/insights/evidence-graph")).toBeNull();
  });

  it("does not treat nested paths as home", () => {
    expect(routeViewExplanationForPathname("/architecture/reviews")).toBeNull();
  });
});
