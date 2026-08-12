import { describe, expect, it } from "vitest";

import {
  allPageContextualHelpRows,
  contextualHelpForPathname,
  type PageContextualHelpEntry,
} from "@/lib/contextual-help-registry";
import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive/executive-dashboard-route";
import {
  INTERNAL_DEMO_READINESS_PATH,
  INTERNAL_DEPLOYMENT_STATUS_PATH,
  INTERNAL_RECOMMENDATION_LEARNING_PATH,
  INTERNAL_REPLAY_PATH,
  INTERNAL_TENANT_HEALTH_PATH,
  INTERNAL_TENANTS_PATH,
  INTERNAL_TRIAL_FUNNEL_PATH,
} from "@/lib/internal-ops-route-paths";

const INTERNAL_ROUTE_IN_COPY =
  /\/(admin|api|governance|settings|integrations|reviews|architectures|help|graph|compare|replay|value-report|digests|planning|advisory|executive|manifests|signed-records)(\/|\b)/i;

const API_PATH_IN_COPY = /\/v\d+\//;

const TB_LABEL_IN_COPY = /\bTB-\d+\b/;

const MAX_WORDS_PER_PAGE = 120;

function entryFieldValues(entry: PageContextualHelpEntry): string[] {
  return [
    entry.whatIsThisPage,
    entry.whatToDoNext,
    entry.whyEmpty ?? "",
    entry.whereToConfigurePrerequisite ?? "",
  ].filter((value) => value.length > 0);
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter((token) => token.length > 0).length;
}

describe("contextual-help-registry (TB-733)", () => {
  it("covers the starting operator pages", () => {
    const prefixes = allPageContextualHelpRows().map((row) => row.prefix);

    // Compared as a set: rows are declared in per-domain modules and resolution picks the longest
    // matching prefix, so declaration order carries no meaning.
    expect([...prefixes].sort()).toEqual([
      "/",
      "/architecture/reviews",
      "/insights/architecture-scorecard",
      "/architecture/executive-dashboard",
      "/governance/findings",
      "/insights/ask-review-questions",
      "/insights/compare-two-reviews",
      "/insights/patterns",
      INTERNAL_REPLAY_PATH,
      "/insights/search-review-evidence",
      "/help/data-handling",
      "/help/dpa-template",
      "/help/soc2-self-assessment",
      "/help/choose-your-next-step",
      "/help/enterprise-onboarding",
      "/help/pilot-feedback",
      "/help/executive-summary",
      "/help/configuration-reference",
      "/help/cli-usage",
      "/help/engineering-troubleshooting",
      "/help/api-contracts",
      "/governance/standards-and-rules",
      "/governance/policy-packs",
      "/governance/decision-register",
      "/architecture/reviews/new",
      "/architecture/architectures",
      "/architecture/architectures/new",
      "/architecture/architecture-intelligence",
      "/architecture/first-review-guide",
      "/governance/audit",
      "/administration/system-health",
      "/administration/connection-status",
      "/administration/developer",
      "/architecture/digests",
      "/digests",
      "/digest-subscriptions",
      "/help/digests",
      "/insights/improvement-planning/plans",
      "/insights/improvement-planning",
      "/insights/impact-preview",
      "/internal/product-learning",
      "/why-archlucid",
      "/demo/explain",
      "/governance/advisory-scans",
      "/insights/executive-summary",
      "/insights/pilot-outcomes",
      "/governance/alert-rules",
      "/governance/approval-queue",
      "/governance/approval-requests",
      "/governance/signed-records",
      INTERNAL_TENANT_HEALTH_PATH,
      INTERNAL_RECOMMENDATION_LEARNING_PATH,
      INTERNAL_TENANTS_PATH,
      INTERNAL_TRIAL_FUNNEL_PATH,
      INTERNAL_DEMO_READINESS_PATH,
      INTERNAL_DEPLOYMENT_STATUS_PATH,
      "/help",
      "/help/accelerator-chooser",
      "/help/admin-diagnostics",
      "/help/authentication-sign-in",
      "/help/azure-boards",
      "/help/integration-readiness",
      "/help/caiq-sig-response",
      "/help/comparison-replay",
      "/help/getting-started",
      "/help/troubleshooting",
      "/help/alerts",
      "/help/billing-and-plans",
      "/help/security-trust",
      "/help/procurement",
      "/help/scope",
      "/help/audit-trail",
      "/help/evidence-trail",
      "/help/evidence-intake",
      "/help/findings",
      "/help/governance-approval",
      "/help/review-guide",
      "/help/repeat-review-loop",
      "/help/pilot-guide",
      "/help/first-architecture-review",
      "/help/cloud-connections/azure",
      "/help/cloud-connections/aws",
      "/help/cloud-connections/gcp",
      "/help/azure-permissions",
      "/help/glossary",
      "/help/users-and-roles",
      "/help/cloud-connections",
      "/administration/users/invite-reviewer",
      "/administration/users",
      "/administration/identity-providers",
      "/administration/identity-providers/oidc",
      "/administration/identity-providers/saml",
      "/administration/identity/sso-wizard",
      "/administration/scim-provisioning",
      "/administration/tenant",
      "/administration/tenant/recycle-bin",
      "/administration/identity-providers/role-mapping",
      "/administration/identity-providers/diagnostics",
      "/administration/api-keys",
      "/administration/preferences",
      "/administration/notifications",
      "/administration/account-security",
      "/administration/auth-domains",
      "/administration/extract-upload",
      "/administration/model-governance",
      "/administration/security-trust",
      "/administration/billing",
      "/administration/ai-usage",
      "/administration/baseline",
      "/integrations/cloud-connections",
      "/integrations/cloud-connections/aws",
      "/integrations/cloud-connections/azure",
      "/integrations/cloud-connections/gcp",
      "/integrations/jira",
      "/integrations/azure-boards",
      "/integrations/itsm/oauth/callback",
      "/integrations/servicenow",
      "/integrations/slack",
      "/integrations/webhooks",
      "/operate/integration-events/dlq",
      "/integrations/teams",
    ].sort());
  });

  it("declares each route in exactly one domain module", () => {
    const prefixes = allPageContextualHelpRows().map((row) => row.prefix);
    const duplicates = prefixes.filter((prefix, index) => prefixes.indexOf(prefix) !== index);

    expect(duplicates).toEqual([]);
  });

  it("resolves nested paths from the longest matching prefix", () => {
    expect(contextualHelpForPathname("/architecture/reviews/new")?.whatIsThisPage).toContain(
      "Start an architecture review",
    );
    expect(contextualHelpForPathname("/architecture/reviews")?.whatIsThisPage).toContain("architecture reviews");
    expect(contextualHelpForPathname("/reviews/new")?.whatIsThisPage).toContain("Start an architecture review");
    expect(contextualHelpForPathname("/architecture/architectures/new")?.whatIsThisPage).toContain(
      "Create architecture",
    );
    expect(contextualHelpForPathname("/architecture/architectures")?.whatIsThisPage).toContain(
      "Architectures list",
    );
    expect(contextualHelpForPathname("/architecture/architectures/draft-abc")?.whatIsThisPage).toContain(
      "Architecture draft workspace",
    );
    expect(contextualHelpForPathname("/architecture/architecture-intelligence")?.whatIsThisPage).toContain(
      "Architecture intelligence",
    );
    expect(contextualHelpForPathname("/architecture/first-review-guide")?.whatIsThisPage).toContain(
      "First review guide",
    );
    expect(contextualHelpForPathname("/governance/findings?filter=open")?.whatToDoNext).toContain("Assign owners");
    expect(contextualHelpForPathname("/insights/executive-summary")?.whatIsThisPage).toContain(
      "Sponsor executive summary",
    );
    expect(contextualHelpForPathname("/insights/improvement-planning/plans/plan-1")?.whatIsThisPage).toContain("one prioritized improvement plan");
  });

  it("resolves Home without stealing other routes (HOM / TB-1667)", () => {
    expect(contextualHelpForPathname("/")?.whatIsThisPage).toContain("Home");
    expect(contextualHelpForPathname("/insights/roi-summary")).toBeNull();
  });

  it("resolves executive dashboard Category-1 help (ARE / GDX)", () => {
    expect(contextualHelpForPathname(EXECUTIVE_DASHBOARD_HREF)?.whatIsThisPage).toContain("Executive dashboard");
    expect(contextualHelpForPathname(EXECUTIVE_DASHBOARD_HREF)?.whyEmpty).toContain("zero");
  });

  it("resolves architecture scorecard Category-1 help (SCX)", () => {
    expect(contextualHelpForPathname("/insights/architecture-scorecard")?.whatIsThisPage).toContain(
      "Architecture scorecard",
    );
    expect(contextualHelpForPathname("/insights/architecture-scorecard")?.whatToDoNext).toContain("ROI");
  });

  it("resolves cloud connections Category-1 help (SCE)", () => {
    expect(contextualHelpForPathname("/integrations/cloud-connections")?.whatIsThisPage).toContain(
      "read-only evidence collection",
    );
    expect(contextualHelpForPathname("/integrations/cloud-connections/azure")?.whatIsThisPage).toContain(
      "Azure cloud connection",
    );
    expect(contextualHelpForPathname("/integrations/cloud-connections/gcp")?.whatIsThisPage).toContain(
      "GCP cloud connection",
    );
    expect(contextualHelpForPathname("/settings/cloud-connections")?.whatIsThisPage).toContain(
      "read-only evidence collection",
    );
  });

  it("resolves run provenance Category-1 help (RRP)", () => {
    expect(contextualHelpForPathname("/reviews/demo-run/provenance")?.whatIsThisPage).toContain(
      "Coordinator provenance",
    );
    expect(contextualHelpForPathname("/architecture/reviews/demo-run/provenance")?.whatToDoNext).toContain(
      "Evidence trail",
    );
  });

  it("resolves alert-rules Category-1 help (ALE hub)", () => {
    expect(contextualHelpForPathname("/governance/alert-rules")?.whatIsThisPage).toContain("notifications");
    expect(contextualHelpForPathname("/governance/alert-rules?tab=notifications")?.whatToDoNext).toContain(
      "Notifications",
    );
  });

  it("resolves getting-started Category-1 help (HGX)", () => {
    expect(contextualHelpForPathname("/help/getting-started")?.whatIsThisPage).toContain("Getting started guide");
    expect(contextualHelpForPathname("/help/getting-started")?.whatToDoNext).toContain("Start a review");
  });

  it("resolves users-and-roles settings Category-1 help (AUX)", () => {
    expect(contextualHelpForPathname("/administration/users")?.whatIsThisPage).toContain("Invite users");
    expect(contextualHelpForPathname("/administration/users")?.whatToDoNext).toContain("Invite a teammate");
  });

  it("resolves Role mapping settings Category-1 help (ADO)", () => {
    expect(
      contextualHelpForPathname("/administration/identity-providers/role-mapping")?.whatIsThisPage,
    ).toContain("Role mapping");
    expect(
      contextualHelpForPathname("/administration/identity-providers/role-mapping")?.whatToDoNext,
    ).toContain("diagnostics");
  });

  it("resolves SAML identity-provider Category-1 help (ASA)", () => {
    expect(contextualHelpForPathname("/administration/identity-providers/saml")?.whatIsThisPage).toContain(
      "SAML",
    );
    expect(contextualHelpForPathname("/administration/identity-providers/saml")?.whatToDoNext).toContain(
      "Fetch IdP metadata",
    );
  });

  it("resolves SSO wizard Category-1 help (ASS)", () => {
    expect(contextualHelpForPathname("/administration/identity/sso-wizard")?.whatIsThisPage).toContain(
      "SSO wizard",
    );
    expect(contextualHelpForPathname("/administration/identity/sso-wizard")?.whatToDoNext).toContain(
      "Choose your identity provider",
    );
  });

  it("resolves SCIM provisioning Category-1 help (ASC)", () => {
    expect(contextualHelpForPathname("/administration/scim-provisioning")?.whatIsThisPage).toContain(
      "SCIM provisioning",
    );
    expect(contextualHelpForPathname("/administration/scim-provisioning")?.whatToDoNext).toContain(
      "Copy the SCIM base URL",
    );
  });

  it("resolves Projects recycle bin Category-1 help (STR)", () => {
    expect(contextualHelpForPathname("/administration/tenant/recycle-bin")?.whatIsThisPage).toContain(
      "Projects recycle bin",
    );
    expect(contextualHelpForPathname("/administration/tenant/recycle-bin")?.whatToDoNext).toContain(
      "Refresh the list",
    );
  });

  it("resolves Tenant settings Category-1 help (ATE)", () => {
    expect(contextualHelpForPathname("/administration/tenant")?.whatIsThisPage).toContain("Tenant settings");
    expect(contextualHelpForPathname("/administration/tenant")?.whatToDoNext).toContain("quality gates");
  });

  it("resolves Identity diagnostics Category-1 help (SEI)", () => {
    expect(
      contextualHelpForPathname("/administration/identity-providers/diagnostics")?.whatIsThisPage,
    ).toContain("Identity diagnostics");
    expect(
      contextualHelpForPathname("/administration/identity-providers/diagnostics")?.whatToDoNext,
    ).toContain("Refresh probes");
  });

  it("resolves API keys settings Category-1 help (ADP)", () => {
    expect(contextualHelpForPathname("/administration/api-keys")?.whatIsThisPage).toContain("API keys");
    expect(contextualHelpForPathname("/administration/api-keys")?.whatToDoNext).toContain(
      "Users and roles",
    );
  });

  it("resolves Preferences settings Category-1 help (ADR)", () => {
    expect(contextualHelpForPathname("/administration/preferences")?.whatIsThisPage).toContain(
      "Preferences",
    );
    expect(contextualHelpForPathname("/administration/preferences")?.whatToDoNext).toContain(
      "theme",
    );
  });

  it("resolves Sign-in methods settings Category-1 help (ADS)", () => {
    expect(contextualHelpForPathname("/administration/account-security")?.whatIsThisPage).toContain(
      "Sign-in methods",
    );
    expect(contextualHelpForPathname("/administration/account-security")?.whatToDoNext).toContain(
      "one-time code",
    );
  });

  it("resolves Sign-in domains settings Category-1 help (ADU)", () => {
    expect(contextualHelpForPathname("/administration/auth-domains")?.whatIsThisPage).toContain(
      "Sign-in domains",
    );
    expect(contextualHelpForPathname("/administration/auth-domains")?.whatToDoNext).toContain(
      "Identity providers",
    );
  });

  it("resolves Extract and Upload settings Category-1 help (ADX)", () => {
    expect(contextualHelpForPathname("/administration/extract-upload")?.whatIsThisPage).toContain(
      "Extract and Upload",
    );
    expect(contextualHelpForPathname("/administration/extract-upload")?.whatToDoNext).toContain(
      "Start a review",
    );
  });

  it("resolves AI and model governance Category-1 help (AMO)", () => {
    expect(contextualHelpForPathname("/administration/model-governance")?.whatIsThisPage).toContain(
      "AI and model governance",
    );
    expect(contextualHelpForPathname("/administration/model-governance")?.whatToDoNext).toContain(
      "AI usage",
    );
  });

  it("resolves approval lineage Category-1 help (GAI)", () => {
    expect(
      contextualHelpForPathname("/governance/approval-requests/e2e-approval-001/lineage")?.whatIsThisPage,
    ).toContain("Approval lineage");
    expect(
      contextualHelpForPathname("/governance/approval-requests/e2e-approval-001/lineage")?.whatToDoNext,
    ).toContain("approval queue");
  });

  it("resolves cloud-connections help Category-1 help (HCE)", () => {
    expect(contextualHelpForPathname("/help/cloud-connections")?.whatIsThisPage).toContain(
      "Cloud connections help",
    );
    expect(contextualHelpForPathname("/help/cloud-connections")?.whatToDoNext).toContain(
      "Cloud connections hub",
    );
  });

  it("resolves CAIQ/SIG response help Category-1 help (ECA)", () => {
    expect(contextualHelpForPathname("/help/caiq-sig-response")?.whatIsThisPage).toContain(
      "CAIQ / SIG questionnaire",
    );
    expect(contextualHelpForPathname("/help/caiq-sig-response")?.whatToDoNextAction?.href).toBe(
      "/help/soc2-self-assessment",
    );
    expect(contextualHelpForPathname("/help/caiq-sig-response")?.whereToConfigureAction?.href).toBe("/trust");
  });

  it("resolves Compare and replay help Category-1 help (CO)", () => {
    expect(contextualHelpForPathname("/help/comparison-replay")?.whatIsThisPage).toContain(
      "Compare and replay",
    );
    expect(contextualHelpForPathname("/help/comparison-replay")?.whatToDoNextAction?.href).toBe(
      "/insights/compare-two-reviews",
    );
    expect(contextualHelpForPathname("/help/comparison-replay")?.whereToConfigureAction?.href).toBe(INTERNAL_REPLAY_PATH);
  });

  it("resolves Connect AWS securely help Category-1 help (HEC)", () => {
    expect(contextualHelpForPathname("/help/cloud-connections/aws")?.whatIsThisPage).toContain(
      "Connect AWS securely",
    );
    expect(contextualHelpForPathname("/help/cloud-connections/aws")?.whatToDoNextAction?.href).toBe(
      "/integrations/cloud-connections/aws",
    );
    expect(contextualHelpForPathname("/help/cloud-connections/aws")?.whereToConfigureAction?.href).toBe(
      "/help/cloud-connections",
    );
  });

  it("resolves Connect GCP securely help Category-1 help (HGC)", () => {
    expect(contextualHelpForPathname("/help/cloud-connections/gcp")?.whatIsThisPage).toContain(
      "Connect GCP securely",
    );
    expect(contextualHelpForPathname("/help/cloud-connections/gcp")?.whatToDoNextAction?.href).toBe(
      "/integrations/cloud-connections/gcp",
    );
    expect(contextualHelpForPathname("/help/cloud-connections/gcp")?.whereToConfigureAction?.href).toBe(
      "/help/cloud-connections",
    );
  });

  it("resolves signed-record detail Category-1 help (MMX)", () => {
    expect(contextualHelpForPathname("/governance/signed-records/demo-manifest")?.whatIsThisPage).toContain(
      "Signed review record",
    );
    expect(contextualHelpForPathname("/governance/signed-records/demo-manifest")?.whatToDoNext).toContain(
      "export the review bundle",
    );
  });

  it("resolves tenant-health Category-1 help (ATX)", () => {
    expect(contextualHelpForPathname(INTERNAL_TENANT_HEALTH_PATH)?.whatIsThisPage).toContain("Tenant health");
    expect(contextualHelpForPathname(INTERNAL_TENANT_HEALTH_PATH)?.whatToDoNext).toContain("Refresh the table");
  });

  it("resolves finding evidence-trace Category-1 help (ERU)", () => {
    expect(
      contextualHelpForPathname(
        "/architecture/reviews/run-1/findings/finding-1/evidence-trace",
      )?.whatIsThisPage,
    ).toContain("Evidence trace");
    expect(
      contextualHelpForPathname(
        "/architecture/reviews/run-1/findings/finding-1/evidence-trace",
      )?.whatToDoNext,
    ).toContain("finding detail");
  });

  it("resolves recommendation-learning Category-1 help (INR)", () => {
    expect(contextualHelpForPathname(INTERNAL_RECOMMENDATION_LEARNING_PATH)?.whatIsThisPage).toContain(
      "Recommendation learning",
    );
    expect(contextualHelpForPathname(INTERNAL_RECOMMENDATION_LEARNING_PATH)?.whatToDoNext).toContain(
      "preview a rebuild",
    );
  });

  it("resolves admin tenants Category-1 help (ATY)", () => {
    expect(contextualHelpForPathname(INTERNAL_TENANTS_PATH)?.whatIsThisPage).toContain("Tenants");
    expect(contextualHelpForPathname(INTERNAL_TENANTS_PATH)?.whatToDoNext).toContain("Create a tenant");
  });

  it("resolves troubleshooting help Category-1 help (HTX)", () => {
    expect(contextualHelpForPathname("/help/troubleshooting")?.whatIsThisPage).toContain("Troubleshooting");
    expect(contextualHelpForPathname("/help/troubleshooting")?.whatToDoNext).toContain("System health");
  });

  it("resolves alerts help Category-1 help (HA)", () => {
    expect(contextualHelpForPathname("/help/alerts")?.whatIsThisPage).toContain("How alerts work");
    expect(contextualHelpForPathname("/help/alerts")?.whatToDoNext).toContain("alerts inbox");
  });

  it("resolves billing and plans help Category-1 help (HBX)", () => {
    expect(contextualHelpForPathname("/help/billing-and-plans")?.whatIsThisPage).toContain("Billing and plans");
    expect(contextualHelpForPathname("/help/billing-and-plans")?.whatToDoNext).toContain("Billing settings");
  });

  it("resolves Azure permissions help Category-1 help (HE)", () => {
    expect(contextualHelpForPathname("/help/azure-permissions")?.whatIsThisPage).toContain("Azure permissions");
    expect(contextualHelpForPathname("/help/azure-permissions")?.whatToDoNext).toContain("Cloud connections");
  });

  it("resolves findings help Category-1 help (HFX)", () => {
    expect(contextualHelpForPathname("/help/findings")?.whatIsThisPage).toContain("Findings");
    expect(contextualHelpForPathname("/help/findings")?.whatToDoNext).toContain("findings queue");
  });

  it("resolves governance approval help Category-1 help (GO)", () => {
    expect(contextualHelpForPathname("/help/governance-approval")?.whatIsThisPage).toContain("Governance approval");
    expect(contextualHelpForPathname("/help/governance-approval")?.whatToDoNext).toContain("approval queue");
  });

  it("resolves review guide help Category-1 help (HR)", () => {
    expect(contextualHelpForPathname("/help/review-guide")?.whatIsThisPage).toContain("Review guide");
    expect(contextualHelpForPathname("/help/review-guide")?.whatToDoNext).toContain("architecture review");
  });

  it("resolves pilot guide help Category-1 help (HP)", () => {
    expect(contextualHelpForPathname("/help/pilot-guide")?.whatIsThisPage).toContain("Pilot guide");
    expect(contextualHelpForPathname("/help/pilot-guide")?.whatToDoNext).toContain("architecture review");
  });

  it("resolves first architecture review help Category-1 help (COR)", () => {
    expect(contextualHelpForPathname("/help/first-architecture-review")?.whatIsThisPage).toContain(
      "Your first architecture review",
    );
    expect(contextualHelpForPathname("/help/first-architecture-review")?.whatToDoNext).toContain(
      "architecture review",
    );
  });

  it("resolves demo explain Category-1 help (DEX)", () => {
    expect(contextualHelpForPathname("/demo/explain")?.whatIsThisPage).toContain("Demo explain");
    expect(contextualHelpForPathname("/demo/explain")?.whatToDoNext).toContain("Validate review");
  });

  it("resolves evidence trail help Category-1 help (EV)", () => {
    expect(contextualHelpForPathname("/help/evidence-trail")?.whatIsThisPage).toContain("Evidence graph");
    expect(contextualHelpForPathname("/help/evidence-trail")?.whatToDoNext).toContain("Evidence graph");
  });

  it("resolves evidence intake help Category-1 help (EVI)", () => {
    expect(contextualHelpForPathname("/help/evidence-intake")?.whatIsThisPage).toContain("Start a review");
    expect(contextualHelpForPathname("/help/evidence-intake")?.whatToDoNext).toContain(
      "architecture review",
    );
  });

  it("resolves enterprise onboarding help Category-1 help (HEX)", () => {
    expect(contextualHelpForPathname("/help/enterprise-onboarding")?.whatIsThisPage).toContain(
      "Enterprise onboarding",
    );
    expect(contextualHelpForPathname("/help/enterprise-onboarding")?.whatToDoNext).toContain(
      "Identity providers",
    );
  });

  it("falls back to generic help guidance for retired pilot-roi-model path", () => {
    expect(contextualHelpForPathname("/help/pilot-roi-model")?.whatIsThisPage).toContain(
      "In-app help topic",
    );
    expect(contextualHelpForPathname("/help/pilot-roi-model")?.whatIsThisPage).not.toContain(
      "Pilot ROI model -",
    );
  });

  it("resolves repeat-review loop help Category-1 help (HRX)", () => {
    expect(contextualHelpForPathname("/help/repeat-review-loop")?.whatIsThisPage).toContain(
      "Repeat-review loop",
    );
    expect(contextualHelpForPathname("/help/repeat-review-loop")?.whatToDoNext).toContain(
      "Compare two reviews",
    );
  });

  it("resolves jira integration Category-1 help (IJX)", () => {
    expect(contextualHelpForPathname("/integrations/jira")?.whatIsThisPage).toContain("Jira integration");
    expect(contextualHelpForPathname("/integrations/jira")?.whatToDoNext).toContain("Test the connector");
  });

  it("resolves ServiceNow integration Category-1 help (ISX)", () => {
    expect(contextualHelpForPathname("/integrations/servicenow")?.whatIsThisPage).toContain("ServiceNow integration");
    expect(contextualHelpForPathname("/integrations/servicenow")?.whatToDoNext).toContain("Test the connector");
  });

  it("resolves slack integration Category-1 help (ISN)", () => {
    expect(contextualHelpForPathname("/integrations/slack")?.whatIsThisPage).toContain("Slack integration");
    expect(contextualHelpForPathname("/integrations/slack")?.whatToDoNext).toContain("Slack destination");
  });

  it("resolves webhooks integration Category-1 help (IWX)", () => {
    expect(contextualHelpForPathname("/integrations/webhooks")?.whatIsThisPage).toContain("Webhooks");
    expect(contextualHelpForPathname("/integrations/webhooks")?.whatToDoNext).toContain("subscription");
  });

  it("resolves teams integration Category-1 help (ITX)", () => {
    expect(contextualHelpForPathname("/integrations/teams")?.whatIsThisPage).toContain("Teams integration");
    expect(contextualHelpForPathname("/integrations/teams")?.whatToDoNext).toContain("Teams connector");
  });

  it("resolves validate review Category-1 help (REP)", () => {
    expect(contextualHelpForPathname(INTERNAL_REPLAY_PATH)?.whatIsThisPage).toContain("Validate review");
    expect(contextualHelpForPathname(INTERNAL_REPLAY_PATH)?.whatToDoNext).toContain("validation depth");
  });

  it("resolves invite-reviewer Category-1 help (SRI)", () => {
    expect(contextualHelpForPathname("/administration/users/invite-reviewer")?.whatIsThisPage).toContain(
      "Invite a reviewer",
    );
    expect(contextualHelpForPathname("/administration/users/invite-reviewer")?.whatToDoNext).toContain(
      "invitation",
    );
  });

  it("resolves Billing & plans settings Category-1 help (ABI)", () => {
    expect(contextualHelpForPathname("/administration/billing")?.whatIsThisPage).toContain(
      "Billing & plans",
    );
    expect(contextualHelpForPathname("/administration/billing")?.whatToDoNext).toContain(
      "Available plans",
    );
  });

  it("resolves AI usage settings Category-1 help (ADI)", () => {
    expect(contextualHelpForPathname("/administration/ai-usage")?.whatIsThisPage).toContain(
      "AI usage and cost",
    );
    expect(contextualHelpForPathname("/administration/ai-usage")?.whatToDoNext).toContain(
      "Billing & plans",
    );
  });

  it("resolves Baseline settings Category-1 help (ADA)", () => {
    expect(contextualHelpForPathname("/administration/baseline")?.whatIsThisPage).toContain(
      "Baseline settings",
    );
    expect(contextualHelpForPathname("/administration/baseline")?.whatToDoNext).toContain(
      "Pilot ROI model",
    );
  });

  it("resolves sponsor executive summary Category-1 help (SPE)", () => {
    expect(contextualHelpForPathname("/insights/executive-summary")?.whatIsThisPage).toContain(
      "Sponsor executive summary",
    );
  });

  it("resolves pilot outcomes Category-1 help (SPP)", () => {
    expect(contextualHelpForPathname("/insights/pilot-outcomes")?.whatIsThisPage).toContain("Pilot outcomes");
    expect(contextualHelpForPathname("/insights/pilot-outcomes")?.whatToDoNext).toContain("reporting period");
  });

  it("resolves system-health Category-1 help with Connection status action (ADY)", () => {
    const entry = contextualHelpForPathname("/administration/system-health");

    expect(entry?.whatIsThisPage).toContain("service health");
    expect(entry?.whatToDoNextAction?.label).toBe("Open Connection status");
    expect(entry?.whatToDoNextAction?.href).toBe("/administration/connection-status");
  });

  it("resolves Connection status Category-1 help (ADC)", () => {
    const entry = contextualHelpForPathname("/administration/connection-status");

    expect(entry?.whatIsThisPage).toContain("Connection status");
    expect(entry?.whatToDoNext).toContain("System health");
    expect(entry?.whatToDoNextAction?.href).toBe("/administration/system-health");
  });

  it("resolves Internal developer tools Category-1 help (SDX)", () => {
    expect(contextualHelpForPathname("/administration/developer")?.whatIsThisPage).toContain(
      "Internal developer tools",
    );
    expect(contextualHelpForPathname("/administration/developer")?.whatToDoNext).toContain(
      "theme selector",
    );
  });

  it("resolves Demo readiness Category-1 help (ADD)", () => {
    expect(contextualHelpForPathname(INTERNAL_DEMO_READINESS_PATH)?.whatIsThisPage).toContain(
      "Demo readiness",
    );
    expect(contextualHelpForPathname(INTERNAL_DEMO_READINESS_PATH)?.whatToDoNext).toContain(
      "System health",
    );
  });

  it("resolves Deployment status Category-1 help (ADE)", () => {
    expect(contextualHelpForPathname(INTERNAL_DEPLOYMENT_STATUS_PATH)?.whatIsThisPage).toContain(
      "Deployment status",
    );
    expect(contextualHelpForPathname(INTERNAL_DEPLOYMENT_STATUS_PATH)?.whatToDoNext).toContain(
      "System health",
    );
  });

  it("returns null for routes not yet migrated", () => {
    expect(contextualHelpForPathname("/insights/roi-summary")).toBeNull();
  });

  it("keeps each page within the Category 1 word budget", () => {
    for (const row of allPageContextualHelpRows()) {
      const totalWords = entryFieldValues(row.entry).reduce((sum, field) => sum + wordCount(field), 0);

      expect(totalWords, row.prefix).toBeLessThanOrEqual(MAX_WORDS_PER_PAGE);
    }
  });

  it("forbids internal routes, API paths, and TB labels in registry copy", () => {
    for (const row of allPageContextualHelpRows()) {
      for (const field of entryFieldValues(row.entry)) {
        expect(field, `${row.prefix} internal route`).not.toMatch(INTERNAL_ROUTE_IN_COPY);
        expect(field, `${row.prefix} API path`).not.toMatch(API_PATH_IN_COPY);
        expect(field, `${row.prefix} TB label`).not.toMatch(TB_LABEL_IN_COPY);
      }
    }
  });
});
