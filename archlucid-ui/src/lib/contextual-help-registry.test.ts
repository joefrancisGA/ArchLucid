import { describe, expect, it } from "vitest";

import {
  allPageContextualHelpRows,
  contextualHelpForPathname,
  type PageContextualHelpEntry,
} from "@/lib/contextual-help-registry";

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

    expect(prefixes).toEqual([
      "/",
      "/architecture/reviews",
      "/insights/architecture-scorecard",
      "/governance/dashboard",
      "/governance/findings",
      "/insights/ask-review-questions",
      "/insights/compare-two-reviews",
      "/replay",
      "/insights/search-review-evidence",
      "/help/data-handling-tenant-isolation",
      "/help/dpa-template",
      "/help/soc2-self-assessment",
      "/help/path-chooser",
      "/help/evaluator-workbook",
      "/help/enterprise-onboarding",
      "/help/pilot-roi-model",
      "/help/policy-pack-delta-demo",
      "/help/configuration-reference",
      "/help/cli-usage",
      "/help/first-review",
      "/help/first-value-20-minutes",
      "/help/developer-troubleshooting",
      "/help/governance-api-contracts",
      "/governance/standards-and-rules",
      "/governance/policy-packs",
      "/governance/decision-register",
      "/reviews/new",
      "/architecture/reviews/new",
      "/governance/audit",
      "/administration/system-health",
      "/administration/connection-status",
      "/architecture/digests",
      "/digests",
      "/help/digests",
      "/insights/planning/plans",
      "/insights/planning",
      "/insights/impact-preview",
      "/internal/product-learning",
      "/why-archlucid",
      "/demo/explain",
      "/governance/advisory-scans",
      "/sponsor-report/executive-summary",
      "/sponsor-report/pilot-outcomes",
      "/executive/scorecard",
      "/governance/alert-rules",
      "/governance/approval-requests",
      "/governance/signed-records",
      "/admin/tenant-health",
      "/admin/trial-funnel",
      "/admin/demo-readiness",
      "/admin/deployment-status",
      "/help/getting-started",
      "/help/how-it-works",
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
      "/help/core-pilot",
      "/help/first-pilot-path",
      "/help/first-hour-operator-path",
      "/help/cloud-connections/azure",
      "/help/azure-permissions",
      "/help/glossary",
      "/help/operator-auth-roles",
      "/help/users-and-roles",
      "/help/cloud-connections",
      "/administration/users/invite-reviewer",
      "/administration/users",
      "/administration/identity-providers/role-mapping",
      "/administration/security-trust",
      "/administration/billing",
      "/administration/ai-usage",
      "/administration/baseline",
      "/integrations/cloud-connections",
      "/integrations/jira",
      "/integrations/itsm/oauth/callback",
      "/integrations/servicenow",
      "/integrations/slack",
      "/integrations/webhooks",
      "/operate/integration-events/dlq",
      "/integrations/teams",
      "/settings/cloud-connections",
    ]);
  });

  it("resolves nested paths from the longest matching prefix", () => {
    expect(contextualHelpForPathname("/architecture/reviews/new")?.whatIsThisPage).toContain(
      "Start an architecture review",
    );
    expect(contextualHelpForPathname("/architecture/reviews")?.whatIsThisPage).toContain("architecture reviews");
    expect(contextualHelpForPathname("/reviews/new")?.whatIsThisPage).toContain("Start an architecture review");
    expect(contextualHelpForPathname("/governance/findings?filter=open")?.whatToDoNext).toContain("Assign owners");
    expect(contextualHelpForPathname("/sponsor-report/executive-summary")?.whatIsThisPage).toContain(
      "Sponsor executive summary",
    );
    expect(contextualHelpForPathname("/insights/planning/plans/plan-1")?.whatIsThisPage).toContain("one prioritized improvement plan");
  });

  it("resolves Overview home without stealing other routes (HOM / TB-1667)", () => {
    expect(contextualHelpForPathname("/")?.whatIsThisPage).toContain("Overview");
    expect(contextualHelpForPathname("/architecture/architectures")).toBeNull();
  });

  it("resolves governance dashboard Category-1 help (GDX)", () => {
    expect(contextualHelpForPathname("/governance/dashboard")?.whatIsThisPage).toContain("Workspace health");
    expect(contextualHelpForPathname("/governance/dashboard")?.whyEmpty).toContain("zero");
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
      "read-only evidence collection",
    );
    expect(contextualHelpForPathname("/settings/cloud-connections")?.whatIsThisPage).toContain("Legacy");
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
    expect(contextualHelpForPathname("/governance/alert-rules?tab=routing")?.whatToDoNext).toContain(
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

  it("resolves signed-record detail Category-1 help (MMX)", () => {
    expect(contextualHelpForPathname("/governance/signed-records/demo-manifest")?.whatIsThisPage).toContain(
      "Signed review record",
    );
    expect(contextualHelpForPathname("/governance/signed-records/demo-manifest")?.whatToDoNext).toContain(
      "export the review bundle",
    );
  });

  it("resolves tenant-health Category-1 help (ATX)", () => {
    expect(contextualHelpForPathname("/admin/tenant-health")?.whatIsThisPage).toContain("Tenant health");
    expect(contextualHelpForPathname("/admin/tenant-health")?.whatToDoNext).toContain("Refresh the table");
  });

  it("resolves how-it-works help Category-1 help (HHX alias → getting-started)", () => {
    expect(contextualHelpForPathname("/help/how-it-works")?.whatIsThisPage).toContain("Getting started");
    expect(contextualHelpForPathname("/help/how-it-works")?.whatToDoNext).toContain("Start a review");
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
    expect(contextualHelpForPathname("/help/core-pilot")?.whatIsThisPage).toContain(
      "Your first architecture review",
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

  it("resolves first-pilot-path help alias Category-1 help (FIR)", () => {
    expect(contextualHelpForPathname("/help/first-pilot-path")?.whatIsThisPage).toContain(
      "Your first architecture review",
    );
  });

  it("resolves evaluator-workbook help alias Category-1 help (HEE)", () => {
    expect(contextualHelpForPathname("/help/evaluator-workbook")?.whatIsThisPage).toContain(
      "primary next action",
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

  it("resolves pilot ROI model help Category-1 help (PI)", () => {
    expect(contextualHelpForPathname("/help/pilot-roi-model")?.whatIsThisPage).toContain(
      "Pilot ROI model",
    );
    expect(contextualHelpForPathname("/help/pilot-roi-model")?.whatToDoNext).toContain(
      "Architecture scorecard",
    );
  });

  it("resolves first-hour-operator-path help alias Category-1 help (HFE)", () => {
    expect(contextualHelpForPathname("/help/first-hour-operator-path")?.whatIsThisPage).toContain(
      "Your first architecture review",
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
    expect(contextualHelpForPathname("/replay")?.whatIsThisPage).toContain("Validate review");
    expect(contextualHelpForPathname("/replay")?.whatToDoNext).toContain("validation depth");
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

  it("resolves executive scorecard Category-1 help (ESX)", () => {
    expect(contextualHelpForPathname("/executive/scorecard")?.whatIsThisPage).toContain("Sponsor scorecard");
    expect(contextualHelpForPathname("/executive/scorecard")?.whatToDoNext).toContain("time range");
  });

  it("resolves sponsor executive summary Category-1 help (SPE)", () => {
    expect(contextualHelpForPathname("/sponsor-report/executive-summary")?.whatIsThisPage).toContain(
      "Sponsor executive summary",
    );
  });

  it("resolves pilot outcomes Category-1 help (SPP)", () => {
    expect(contextualHelpForPathname("/sponsor-report/pilot-outcomes")?.whatIsThisPage).toContain("Pilot outcomes");
    expect(contextualHelpForPathname("/sponsor-report/pilot-outcomes")?.whatToDoNext).toContain("reporting period");
  });

  it("resolves system-health Category-1 help with Connection status action (ADY)", () => {
    const entry = contextualHelpForPathname("/administration/system-health");

    expect(entry?.whatIsThisPage).toContain("service health");
    expect(entry?.whatToDoNextAction?.label).toBe("Open Connection status");
    expect(entry?.whatToDoNextAction?.href).toBe("/administration/connection-status");
  });

  it("resolves Connection status Category-1 help (ADC)", () => {
    expect(contextualHelpForPathname("/administration/connection-status")?.whatIsThisPage).toContain(
      "Connection status",
    );
    expect(contextualHelpForPathname("/administration/connection-status")?.whatToDoNext).toContain(
      "System health",
    );
  });

  it("resolves Demo readiness Category-1 help (ADD)", () => {
    expect(contextualHelpForPathname("/admin/demo-readiness")?.whatIsThisPage).toContain(
      "Demo readiness",
    );
    expect(contextualHelpForPathname("/admin/demo-readiness")?.whatToDoNext).toContain(
      "System health",
    );
  });

  it("resolves Deployment status Category-1 help (ADE)", () => {
    expect(contextualHelpForPathname("/admin/deployment-status")?.whatIsThisPage).toContain(
      "Deployment status",
    );
    expect(contextualHelpForPathname("/admin/deployment-status")?.whatToDoNext).toContain(
      "System health",
    );
  });

  it("returns null for routes not yet migrated", () => {
    expect(contextualHelpForPathname("/architecture/architectures")).toBeNull();
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
