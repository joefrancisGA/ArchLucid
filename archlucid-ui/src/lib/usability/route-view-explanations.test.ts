import { describe, expect, it } from "vitest";

import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import {
  ARCHITECTURES_LIST_PATH,
  ARCHITECTURES_NEW_PATH,
  architectureDraftPath,
} from "@/lib/architecture/architecture-routes";
import { SETTINGS_BILLING_PATH } from "@/lib/billing-and-plans-help-route";
import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import { GOVERNANCE_ALERTS_PATH, GOVERNANCE_EXCEPTIONS_PATH } from "@/lib/governance/governance-route-paths";
import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";
import { routeViewExplanationForPathname, explainViewDismissKey } from "@/lib/usability/route-view-explanations";

describe("routeViewExplanationForPathname (TB-2216 / TB-2257)", () => {
  it("covers compare, alerts, and SSO hubs; home owns orientation via command center", () => {
    expect(routeViewExplanationForPathname("/")).toBeNull();
    expect(routeViewExplanationForPathname("/insights/compare-two-reviews")?.title).toBe("Compare two reviews");
    expect(routeViewExplanationForPathname(GOVERNANCE_ALERTS_PATH)?.title).toBe("Alerts");
    expect(routeViewExplanationForPathname("/alerts")?.title).toBe("Alerts");
    expect(routeViewExplanationForPathname("/administration/identity/sso-wizard")?.title).toBe("SSO wizard");
    expect(routeViewExplanationForPathname("/administration/identity-providers")).toBeNull();
    expect(routeViewExplanationForPathname("/administration/identity-providers/saml")?.title).toBe(
      "SAML configuration",
    );
    expect(routeViewExplanationForPathname("/administration/identity-providers/oidc")?.title).toBe("OIDC/JWT status");
    expect(routeViewExplanationForPathname("/administration/identity-providers/role-mapping")?.title).toBe(
      "Role mapping status",
    );
    expect(routeViewExplanationForPathname("/administration/identity-providers/diagnostics")).toBeNull();
  });

  it("describes SSO wizard next steps as a sandbox claim-mapping test", () => {
    const wizard = routeViewExplanationForPathname("/administration/identity/sso-wizard");

    expect(wizard?.nextAction.toLowerCase()).toContain("sandbox sign-in test");
    expect(wizard?.nextAction.toLowerCase()).toContain("sample claim values");
    expect(wizard?.nextAction.toLowerCase()).toContain("claim-to-role mapping");
    expect(wizard?.nextAction).not.toMatch(/test user from your idp/i);
  });

  it("describes SAML next steps without claiming the wizard enables sign-in", () => {
    const saml = routeViewExplanationForPathname("/administration/identity-providers/saml");

    expect(saml?.nextAction).toContain("test the saved mapping");
    expect(saml?.nextAction).toContain("does not switch anyone to SAML sign-in");
    // The wizard Activate step posts to the same tenant-only /activate endpoint, so it enables nothing.
    expect(saml?.nextAction).not.toMatch(/enable SAML sign-in separately/i);
    expect(saml?.nextActionLinks).toEqual([
      {
        label: "SSO setup wizard",
        href: "/administration/identity/sso-wizard",
      },
    ]);
  });

  it("covers TB-2257 explain-this-view expansions with buyer nouns", () => {
    expect(routeViewExplanationForPathname(DIGESTS_HUB_PATH)).toBeNull();
    expect(routeViewExplanationForPathname(DIGESTS_HUB_PATH, { search: "tab=get-started" })).toBeNull();
    expect(routeViewExplanationForPathname(DIGESTS_HUB_PATH, { search: "tab=subscriptions" })).toBeNull();

    const digestsSchedule = routeViewExplanationForPathname(DIGESTS_HUB_PATH, { search: "tab=schedule" });
    expect(digestsSchedule?.title).toBe("Digests");
    expect(digestsSchedule?.summary.toLowerCase()).toContain("digest");
    expect(digestsSchedule?.summary.toLowerCase()).toContain("content cadence");

    const aiUsage = routeViewExplanationForPathname(AI_USAGE_SETTINGS_PATH);
    expect(aiUsage?.title).toBe("AI usage");
    expect(aiUsage?.summary.toLowerCase()).toContain("budget");

    const quietAiUsage = routeViewExplanationForPathname(AI_USAGE_SETTINGS_PATH, {
      isAiUsageQuietEmptyPeriod: true,
    });
    expect(quietAiUsage?.nextAction.toLowerCase()).not.toContain("scan current period usage");

    const billing = routeViewExplanationForPathname(SETTINGS_BILLING_PATH);
    expect(billing?.title).toBe("Billing & plans");
    expect(billing?.summary.toLowerCase()).toContain("plan");

    const impact = routeViewExplanationForPathname(IMPACT_PREVIEW_PATH);
    expect(impact?.title).toBe("Impact preview");
    expect(impact?.summary.toLowerCase()).toContain("architecture");

    expect(routeViewExplanationForPathname(IMPACT_PREVIEW_PATH, { impactPreviewPageState: "no_baseline" })).toBeNull();

    const architectures = routeViewExplanationForPathname(ARCHITECTURES_LIST_PATH);
    expect(architectures?.title).toBe("Architecture drafts");
    expect(architectures?.summary.toLowerCase()).toContain("draft");
  });

  it("keeps other governance and evidence-graph null when headers own orientation", () => {
    expect(routeViewExplanationForPathname("/governance")).toBeNull();
    // Risk exceptions own layer guidance plus the governance approval banner — a shell banner would repeat it.
    expect(routeViewExplanationForPathname(GOVERNANCE_EXCEPTIONS_PATH)).toBeNull();
    expect(routeViewExplanationForPathname("/governance/findings")).toBeNull();
    expect(routeViewExplanationForPathname("/governance/audit")).toBeNull();
    expect(routeViewExplanationForPathname("/insights/evidence-graph")).toBeNull();
    expect(routeViewExplanationForPathname("/administration/identity-providers/diagnostics")).toBeNull();
  });

  it("does not treat nested paths as home", () => {
    expect(routeViewExplanationForPathname("/architecture/reviews")).toBeNull();
  });

  it("keeps drafts-inventory orientation off the draft editor and the new-draft workspace", () => {
    expect(routeViewExplanationForPathname(architectureDraftPath("vertex"))).toBeNull();
    expect(routeViewExplanationForPathname(ARCHITECTURES_NEW_PATH)).toBeNull();
  });

  it("shares explain-this-view dismiss keys across identity provider tabs", () => {
    expect(explainViewDismissKey("/administration/identity-providers/oidc")).toBe(
      explainViewDismissKey("/administration/identity-providers/saml"),
    );
    expect(explainViewDismissKey("/administration/identity-providers/role-mapping")).toBe(
      explainViewDismissKey("/administration/identity-providers/oidc"),
    );
    expect(explainViewDismissKey("/administration/identity-providers")).not.toBe(
      explainViewDismissKey("/administration/identity-providers/oidc"),
    );
  });
});
