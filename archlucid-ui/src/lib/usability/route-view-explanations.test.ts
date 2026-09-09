import { describe, expect, it } from "vitest";

import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import {
  ARCHITECTURES_LIST_PATH,
  ARCHITECTURES_NEW_PATH,
  REVIEWS_LIST_PATH,
  REVIEWS_NEW_PATH,
  architectureDraftPath,
} from "@/lib/architecture/architecture-routes";
import { AUTH_DOMAINS_SETTINGS_CANONICAL_PATH } from "@/lib/auth-domains-settings-evidence-copy";
import { CLOUD_PROVIDER_CONNECTION_PATHS } from "@/lib/cloud-provider-connection-evidence-copy";
import { EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH } from "@/lib/extract-upload-settings-evidence-copy";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import { SETTINGS_BILLING_PATH } from "@/lib/billing-and-plans-help-route";
import { CLOUD_CONNECTIONS_CANONICAL_PATH } from "@/lib/cloud-connections-evidence-copy";
import { CONNECTION_STATUS_CANONICAL_PATH } from "@/lib/connection-status-evidence-copy";
import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import {
  GOVERNANCE_ALERT_RULES_PATH,
  GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_EXCEPTIONS_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  INTEGRATIONS_JIRA_PATH,
  INTEGRATIONS_SLACK_PATH,
  INTEGRATIONS_WEBHOOKS_PATH,
} from "@/lib/integrations-nav-paths";
import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import { BASELINE_SETTINGS_CANONICAL_PATH } from "@/lib/baseline-settings-evidence-copy";
import { HELP_HUB_CANONICAL_PATH } from "@/lib/help/help-hub-evidence-copy";
import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";
import { NOTIFICATION_PREFERENCE_CENTER_PATH } from "@/lib/notification-preference-center";
import { PATTERN_LIBRARY_PATH } from "@/lib/pattern-library-route";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";
import {
  SETTINGS_ROOT_PATH,
  SETTINGS_SECURITY_TRUST_PATH,
  SETTINGS_SUPPORT_PATH,
  SETTINGS_USERS_PATH,
  SETTINGS_WORKSPACE_SETTINGS_PATH,
} from "@/lib/settings-admin-route-paths";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import {
  SPONSOR_REPORT_PATH,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
} from "@/lib/sponsor-report-navigation";
import { routeViewExplanationForPathname, explainViewDismissKey } from "@/lib/usability/route-view-explanations";

describe("routeViewExplanationForPathname (TB-2216 / TB-2257)", () => {
  it("covers compare, alerts, and SSO hubs; home owns orientation via command center", () => {
    expect(routeViewExplanationForPathname("/")).toBeNull();
    expect(routeViewExplanationForPathname(ASK_REVIEW_QUESTIONS_PATH)?.title).toBe("Ask review questions");
    expect(routeViewExplanationForPathname(REVIEWS_LIST_PATH)?.title).toBe("Reviews");
    expect(routeViewExplanationForPathname(`${REVIEWS_LIST_PATH}/run-abc`)).toBeNull();
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

    const impact = routeViewExplanationForPathname(IMPACT_PREVIEW_PATH, { impactPreviewPageState: "ready" });
    expect(impact?.title).toBe("Impact preview");
    expect(impact?.summary.toLowerCase()).toContain("architecture");

    expect(routeViewExplanationForPathname(IMPACT_PREVIEW_PATH, { impactPreviewPageState: "no_baseline" })).toBeNull();
    expect(routeViewExplanationForPathname(IMPACT_PREVIEW_PATH)).toBeNull();

    const architectures = routeViewExplanationForPathname(ARCHITECTURES_LIST_PATH);
    expect(architectures?.title).toBe("Architectures");
    expect(architectures?.summary.toLowerCase()).toContain("draft");
  });

  it("keeps other governance and evidence-graph null when headers own orientation", () => {
    expect(routeViewExplanationForPathname("/governance")).toBeNull();
    // Risk exceptions own layer guidance plus the approval banner — a shell banner would repeat it.
    expect(routeViewExplanationForPathname(GOVERNANCE_EXCEPTIONS_PATH)).toBeNull();
    expect(routeViewExplanationForPathname("/governance/findings")).toBeNull();
    expect(routeViewExplanationForPathname("/governance/audit")).toBeNull();
    expect(routeViewExplanationForPathname(GOVERNANCE_ALERT_RULES_PATH)?.title).toBe("Alert rules");
    expect(routeViewExplanationForPathname("/insights/evidence-graph")).toBeNull();
    expect(routeViewExplanationForPathname("/administration/identity-providers/diagnostics")).toBeNull();
  });

  it("covers reviews hub inventory only — not open review detail routes", () => {
    expect(routeViewExplanationForPathname(REVIEWS_LIST_PATH)?.title).toBe("Reviews");
    expect(routeViewExplanationForPathname(`${REVIEWS_LIST_PATH}/run-abc`)).toBeNull();
  });

  it("covers instrument primer expansions for analysis, help, sponsor, and admin hubs", () => {
    expect(routeViewExplanationForPathname(SEARCH_REVIEW_EVIDENCE_PATH)?.title).toBe("Search review evidence");
    expect(routeViewExplanationForPathname(SEARCH_REVIEW_EVIDENCE_PATH)?.summary.toLowerCase()).toContain(
      "finalized review",
    );

    expect(routeViewExplanationForPathname(PATTERN_LIBRARY_PATH)?.title).toBe("Pattern library");
    expect(routeViewExplanationForPathname(`${PATTERN_LIBRARY_PATH}/serverless-api`)).toBeNull();

    expect(routeViewExplanationForPathname(HELP_HUB_CANONICAL_PATH)?.title).toBe("Help");
    expect(routeViewExplanationForPathname(`${HELP_HUB_CANONICAL_PATH}/review-guide`)).toBeNull();

    expect(routeViewExplanationForPathname(SPONSOR_DASHBOARD_HREF)?.title).toBe("Portfolio overview");

    expect(routeViewExplanationForPathname(SETTINGS_SECURITY_TRUST_PATH)?.title).toBe("Security & trust");
    expect(routeViewExplanationForPathname(SETTINGS_WORKSPACE_SETTINGS_PATH)?.title).toBe("Workspace settings");
    expect(routeViewExplanationForPathname(`${SETTINGS_WORKSPACE_SETTINGS_PATH}/recycle-bin`)).toBeNull();
    expect(routeViewExplanationForPathname(SETTINGS_USERS_PATH)?.title).toBe("Users & roles");
  });

  it("covers instrument primer wave 6 — integrations, outcomes, onboarding, and admin index", () => {
    expect(routeViewExplanationForPathname(SETTINGS_ROOT_PATH)?.title).toBe("Administration");
    expect(routeViewExplanationForPathname(`${SETTINGS_ROOT_PATH}/billing`)?.title).toBe("Billing & plans");

    expect(routeViewExplanationForPathname(NOTIFICATION_PREFERENCE_CENTER_PATH)?.title).toBe("Notifications");

    expect(routeViewExplanationForPathname(CONNECTION_STATUS_CANONICAL_PATH)?.title).toBe("Connection status");

    expect(routeViewExplanationForPathname(CLOUD_CONNECTIONS_CANONICAL_PATH)?.title).toBe("Cloud connections");
    expect(routeViewExplanationForPathname(CLOUD_PROVIDER_CONNECTION_PATHS.azure)?.title).toBe("Azure cloud connection");

    expect(routeViewExplanationForPathname(FIRST_REVIEW_GUIDE_PATH)?.title).toBe("First review guide");

    expect(routeViewExplanationForPathname(ARCHITECTURE_INTELLIGENCE_PATH)?.title).toBe("Architecture intelligence");

    expect(routeViewExplanationForPathname(ARCHITECTURE_SCORECARD_PATH)?.title).toBe("Architecture scorecard");

    expect(routeViewExplanationForPathname(SPONSOR_REPORT_PATH)?.title).toBe("Sponsor report");
    expect(routeViewExplanationForPathname(SPONSOR_REPORT_ROI_SUMMARY_PATH)?.title).toBe("ROI summary");
  });

  it("covers instrument primer wave 7 — ITSM, notification channels, baseline, and system health", () => {
    expect(routeViewExplanationForPathname(INTEGRATIONS_JIRA_PATH)?.title).toBe("Jira integration");
    expect(routeViewExplanationForPathname(INTEGRATIONS_SLACK_PATH)?.title).toBe("Slack integration");
    expect(routeViewExplanationForPathname(INTEGRATIONS_WEBHOOKS_PATH)?.title).toBe("Webhooks");

    expect(routeViewExplanationForPathname(BASELINE_SETTINGS_CANONICAL_PATH)?.title).toBe("Baseline settings");
    expect(routeViewExplanationForPathname(ADMINISTRATION_SYSTEM_HEALTH_PATH)?.title).toBe("System health");
  });

  it("covers instrument primer wave 8 — cloud provider wizards, review intake, and admin utilities", () => {
    expect(routeViewExplanationForPathname(REVIEWS_NEW_PATH)?.title).toBe("Start a review");

    expect(routeViewExplanationForPathname(CLOUD_PROVIDER_CONNECTION_PATHS.aws)?.title).toBe("AWS cloud connection");
    expect(routeViewExplanationForPathname(CLOUD_PROVIDER_CONNECTION_PATHS.gcp)?.title).toBe("GCP cloud connection");

    expect(routeViewExplanationForPathname(SETTINGS_SUPPORT_PATH)?.title).toBe("Support");
    expect(routeViewExplanationForPathname(AUTH_DOMAINS_SETTINGS_CANONICAL_PATH)?.title).toBe("Sign-in domains");
    expect(routeViewExplanationForPathname(EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH)?.title).toBe("Extract and upload");
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
