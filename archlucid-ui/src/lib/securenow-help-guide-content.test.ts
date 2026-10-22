import { describe, expect, it } from "vitest";

import { contextualHelpForPathname } from "@/lib/contextual-help-registry";
import {
  SECURENOW_ASSIGNED_TO_ME_FINDINGS,
  SECURENOW_DATA_HANDLING_HELP,
  SECURENOW_ENTERPRISE_ONBOARDING_HELP,
  SECURENOW_FINDINGS_QUEUE_HUB,
  SECURENOW_GETTING_STARTED_HELP,
  SECURENOW_CLOUD_CONNECTIONS_HUB,
  SECURENOW_CLOUD_CONNECTIONS_HELP,
  SECURENOW_INTEGRATION_READINESS_HELP,
  SECURENOW_POLICY_PACKS_HUB,
  SECURENOW_STANDARDS_RULES_HUB,
  SECURENOW_INVITE_REVIEWER,
  SECURENOW_TROUBLESHOOTING_HELP,
  SECURENOW_USERS_ADMIN,
  SECURENOW_USERS_AND_ROLES_HELP,
} from "@/lib/contextual-help/securenow-contextual-help-overrides";
import { SECURENOW_HELP_HUB_CONTEXTUAL_HELP_ENTRY } from "@/lib/contextual-help/help-topic-rows-operator";
import { ENTERPRISE_ONBOARDING_HELP_CANONICAL_PATH } from "@/lib/enterprise-onboarding-help-evidence-copy";
import { INTEGRATION_READINESS_HELP_CANONICAL_PATH } from "@/lib/integration-readiness-help-evidence-copy";
import { INVITE_REVIEWER_CANONICAL_PATH } from "@/lib/invite-reviewer-evidence-copy";
import { SETTINGS_USERS_CANONICAL_PATH } from "@/lib/settings-users-evidence-copy";
import { USERS_AND_ROLES_HELP_CANONICAL_PATH } from "@/lib/users-and-roles-help-evidence-copy";
import {
  resolveGettingStartedHelpClaimDiscipline,
  resolveGettingStartedHelpPlainLanguageTerms,
  resolveGettingStartedHelpSources,
  resolveGettingStartedHelpWorkflowSectionIntro,
  SECURENOW_GETTING_STARTED_HELP_CLAIM_DISCIPLINE,
  SECURENOW_GETTING_STARTED_HELP_SOURCES,
  SECURENOW_GETTING_STARTED_HELP_WORKFLOW_SECTION_INTRO,
} from "@/lib/getting-started-help-guide-content";
import { resolveDataHandlingTenantIsolationHelpClaimDiscipline } from "@/lib/data-handling-tenant-isolation-help-evidence-copy";
import {
  dataHandlingTenantIsolationHelpLeavesStaysHelper,
  dataHandlingTenantIsolationHelpOverviewLead,
  dataHandlingTenantIsolationHelpPageSubtitle,
} from "@/lib/data-handling-tenant-isolation-help-guide-content";
import { integrationReadinessHelpOverview } from "@/lib/integration-readiness-help-guide-content";
import {
  findingsHelpAnatomyFields,
  findingsHelpOverview,
  findingsHelpPageSubtitle,
  findingsHelpRoleGuidance,
} from "@/lib/findings/findings-help-guide-content";
import {
  resolveFindingsHelpClaimDiscipline,
  resolveFindingsHelpSources,
} from "@/lib/findings/findings-help-evidence-copy";
import { listHelpCenterFeaturedSlugs, listHelpCenterTopics } from "@/lib/help/help-center-catalog";
import { localizeHelpSearchPanelTopic } from "@/lib/help/help-product-copy";
import { START_HERE_TOPICS } from "@/lib/help/help-search-panel-catalog-topics";
import { policyPacksHelpDiagramSource } from "@/lib/policy/policy-packs-help-guide-content";
import {
  standardsRulesHelpHowToReadSteps,
  standardsRulesHelpOverview,
  standardsRulesHelpPageSubtitle,
} from "@/lib/standards-rules-help-guide-content";
import {
  SECURENOW_TROUBLESHOOTING_BEFORE_CONTACT_ITEMS,
  SECURENOW_TROUBLESHOOTING_DECISION_TREE_STEPS,
} from "@/lib/product-line/securenow-troubleshooting-help-guide-content";
import {
  SECURENOW_TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE,
  resolveTroubleshootingHelpSources,
} from "@/lib/troubleshooting-help-evidence-copy";
import {
  troubleshootingBeforeContactItems,
  troubleshootingCommonIssues,
  troubleshootingDecisionTreeSteps,
} from "@/lib/troubleshooting-help-guide-content";
import {
  usersAndRolesCapabilityLabel,
  usersAndRolesCapabilityRows,
  usersAndRolesFaq,
  usersAndRolesRoleOverview,
} from "@/lib/users-and-roles-help-manifest";

describe("SecureNow help guide content", () => {
  it("uses SecureNow getting-started claim discipline and vocabulary without review-flow language", () => {
    expect(resolveGettingStartedHelpClaimDiscipline("security")).toBe(SECURENOW_GETTING_STARTED_HELP_CLAIM_DISCIPLINE);
    expect(resolveGettingStartedHelpClaimDiscipline("security")).not.toContain("review flow");
    expect(resolveGettingStartedHelpPlainLanguageTerms("security").some((term) => term.term === "Cloud inventory")).toBe(
      true,
    );
    expect(resolveGettingStartedHelpPlainLanguageTerms("security").some((term) => term.term === "Sealed review record")).toBe(
      false,
    );
  });

  it("uses SecureNow data-handling evidence copy without review-package cites", () => {
    expect(resolveDataHandlingTenantIsolationHelpClaimDiscipline("security")).toContain("cloud inventory evidence");
    expect(dataHandlingTenantIsolationHelpLeavesStaysHelper("security")).toContain("cloud inventory evidence");
    expect(dataHandlingTenantIsolationHelpLeavesStaysHelper("security")).not.toContain("review evidence");
    expect(dataHandlingTenantIsolationHelpPageSubtitle(false, "security")).toContain("SecureNow");
    expect(dataHandlingTenantIsolationHelpPageSubtitle(false, "security")).not.toContain("review evidence flows");
    expect(dataHandlingTenantIsolationHelpOverviewLead("security")).not.toContain("architecture reviews");
    expect(contextualHelpForPathname("/help/data-handling", { productLineId: "security" })?.whatIsThisPage).toBe(
      SECURENOW_DATA_HANDLING_HELP.whatIsThisPage,
    );
  });

  it("resolves SecureNow help hub contextual help without architect-evaluator framing", () => {
    const hubHelp = contextualHelpForPathname("/help", { productLineId: "security" });

    expect(hubHelp?.whatIsThisPage).toBe(SECURENOW_HELP_HUB_CONTEXTUAL_HELP_ENTRY.whatIsThisPage);
    expect(hubHelp?.whatIsThisPage).not.toMatch(/architects and evaluators/i);
    expect(hubHelp?.whatToDoNext).toContain("Security and trust");
    expect(hubHelp?.taskSteps?.join(" ")).not.toMatch(/first-run workflow/i);
  });

  it("resolves SecureNow integration readiness and enterprise onboarding contextual help", () => {
    const integrationHelp = contextualHelpForPathname(INTEGRATION_READINESS_HELP_CANONICAL_PATH, {
      productLineId: "security",
    });
    const onboardingHelp = contextualHelpForPathname(ENTERPRISE_ONBOARDING_HELP_CANONICAL_PATH, {
      productLineId: "security",
    });

    expect(integrationHelp?.whatIsThisPage).toBe(SECURENOW_INTEGRATION_READINESS_HELP.whatIsThisPage);
    expect(integrationHelp?.whatToDoNext).not.toMatch(/chat connectors first/i);
    expect(integrationReadinessHelpOverview("security")).not.toMatch(/architecture reviews/i);

    expect(onboardingHelp?.whatIsThisPage).toBe(SECURENOW_ENTERPRISE_ONBOARDING_HELP.whatIsThisPage);
    expect(onboardingHelp?.whatToDoNext).not.toMatch(/first architecture review/i);
  });

  it("uses SecureNow findings claim, sources, anatomy, and roles without architecture-review language", () => {
    expect(resolveFindingsHelpClaimDiscipline("security")).not.toContain("finalized architecture review");
    expect(resolveFindingsHelpSources("security").some((source) => source.label === "Search review evidence")).toBe(
      false,
    );
    expect(findingsHelpAnatomyFields("security").find((field) => field.label === "Severity")?.description).not.toContain(
      "for the review",
    );
    expect(findingsHelpRoleGuidance("security").some((entry) => entry.role === "Solution architect")).toBe(false);
    expect(findingsHelpRoleGuidance("security").some((entry) => entry.role === "Security operator")).toBe(true);
  });

  it("uses SecureNow getting-started sources without architecture review CTAs", () => {
    const sources = resolveGettingStartedHelpSources("security");

    expect(sources).toEqual(SECURENOW_GETTING_STARTED_HELP_SOURCES);
    expect(sources.some((link) => link.href.includes("/architecture/reviews"))).toBe(false);
    expect(sources.some((link) => link.href.includes("first-architecture-review"))).toBe(false);
  });

  it("uses SecureNow getting-started workflow section intro without sealed-review language", () => {
    expect(resolveGettingStartedHelpWorkflowSectionIntro("security")).toBe(
      SECURENOW_GETTING_STARTED_HELP_WORKFLOW_SECTION_INTRO,
    );
    expect(resolveGettingStartedHelpWorkflowSectionIntro("security")).not.toContain("shareable outputs");
  });

  it("keeps architecture getting-started sources unchanged", () => {
    const sources = resolveGettingStartedHelpSources("architecture");

    expect(sources.some((link) => link.href === "/architecture/reviews/new")).toBe(true);
  });

  it("localizes help search getting-started topics for SecureNow", () => {
    const gettingStarted = START_HERE_TOPICS.find((topic) => topic.id === "getting-started-help");
    const howItWorks = START_HERE_TOPICS.find((topic) => topic.id === "how-archlucid-works");

    expect(gettingStarted).toBeDefined();
    expect(howItWorks).toBeDefined();
    expect(localizeHelpSearchPanelTopic(gettingStarted!, "security").description).toContain("ARC-AMPE");
    expect(localizeHelpSearchPanelTopic(howItWorks!, "security").description).toContain("cloud inventory");
  });

  it("excludes billing from SecureNow featured help hub topics", () => {
    expect(listHelpCenterFeaturedSlugs("security")).not.toContain("billing-and-plans");

    const topics = listHelpCenterTopics({ showAdvanced: true, isAdmin: true, productLineId: "security" });
    expect(topics.map((entry) => entry.slug)).not.toContain("billing-and-plans");
    expect(topics.map((entry) => entry.slug)).not.toContain("career-rehearsal-doors");
  });

  it("serves SecureNow findings help copy without review-finalize language", () => {
    expect(findingsHelpPageSubtitle("security")).toContain("ARC-AMPE");
    expect(findingsHelpOverview("security")).not.toContain("during a review");
    expect(findingsHelpOverview("architecture")).toContain("during a review");
  });

  it("uses inventory outcomes in SecureNow policy-pack diagram", () => {
    expect(policyPacksHelpDiagramSource("security")).toContain("Findings against inventory");
    expect(policyPacksHelpDiagramSource("security")).not.toContain("Finalized review record");
    expect(policyPacksHelpDiagramSource("architecture")).toContain("Finalized review record");
  });

  it("filters architecture-only troubleshooting issues for SecureNow", () => {
    const issues = troubleshootingCommonIssues("security");

    expect(issues.some((issue) => issue.id === "sample-review-missing")).toBe(false);
    expect(issues.some((issue) => issue.id === "organization-sso-required")).toBe(true);
    expect(issues.some((issue) => issue.id === "azure-connector-unhealthy")).toBe(true);
    expect(
      issues.flatMap((issue) => issue.nextSteps).some((step) => step.href.includes("/architecture/reviews")),
    ).toBe(false);
  });

  it("uses SecureNow troubleshooting decision tree without architecture review steps", () => {
    const steps = troubleshootingDecisionTreeSteps("security");

    expect(steps).toEqual(SECURENOW_TROUBLESHOOTING_DECISION_TREE_STEPS);
    expect(steps.some((step) => step.question.toLowerCase().includes("review"))).toBe(false);
    expect(
      steps.flatMap((step) => step.branches).some((branch) => branch.href.includes("/architecture/reviews")),
    ).toBe(false);
    expect(steps.some((step) => step.id === "decision-inventory")).toBe(true);
    expect(steps.some((step) => step.id === "decision-packs-assigned")).toBe(true);
  });

  it("omits review name from SecureNow before-contact checklist", () => {
    const items = troubleshootingBeforeContactItems("security");

    expect(items).toEqual(SECURENOW_TROUBLESHOOTING_BEFORE_CONTACT_ITEMS);
    expect(items.some((item) => item.toLowerCase().includes("review"))).toBe(false);
    expect(items.some((item) => item.toLowerCase().includes("finding"))).toBe(true);
  });

  it("uses SecureNow troubleshooting claim discipline and follow-up sources", () => {
    expect(SECURENOW_TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE).not.toContain("unblock reviews");
    expect(SECURENOW_TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE).toContain("connectors");

    const sources = resolveTroubleshootingHelpSources("security");
    expect(sources.some((source) => source.label === "Azure connections")).toBe(true);
    expect(sources.some((source) => source.href.includes("how-archlucid-works"))).toBe(false);
  });

  it("resolves SecureNow contextual help for findings and onboarding routes", () => {
    const tenantFindingsHelp = contextualHelpForPathname("/governance/findings", { productLineId: "security" });

    expect(tenantFindingsHelp?.whatIsThisPage).toBe(SECURENOW_FINDINGS_QUEUE_HUB.whatIsThisPage);
    expect(tenantFindingsHelp?.whatIsThisPage).not.toMatch(/architecture review/i);
    expect(tenantFindingsHelp?.whyEmpty).not.toMatch(/approval decisions are recorded in reviews/i);
    expect(tenantFindingsHelp?.whereToConfigureAction?.href).not.toContain("search-review-evidence");
    expect(contextualHelpForPathname("/compliance/findings", { productLineId: "security" })?.whatIsThisPage).toBe(
      SECURENOW_FINDINGS_QUEUE_HUB.whatIsThisPage,
    );
    expect(contextualHelpForPathname("/compliance/findings", { productLineId: "security" })?.whereToConfigureAction?.href).toBe(
      "/compliance/policy-packs",
    );
    expect(
      contextualHelpForPathname("/security/assigned-to-me", { productLineId: "security" })?.whatIsThisPage,
    ).toBe(SECURENOW_ASSIGNED_TO_ME_FINDINGS.whatIsThisPage);
    expect(contextualHelpForPathname("/help/getting-started", { productLineId: "security" })?.whatIsThisPage).toBe(
      SECURENOW_GETTING_STARTED_HELP.whatIsThisPage,
    );
    expect(contextualHelpForPathname("/help/troubleshooting", { productLineId: "security" })?.whatIsThisPage).toBe(
      SECURENOW_TROUBLESHOOTING_HELP.whatIsThisPage,
    );
    expect(contextualHelpForPathname("/help/troubleshooting", { productLineId: "security" })?.whatIsThisPage).not.toMatch(
      /architect workflows/i,
    );
    expect(contextualHelpForPathname(SETTINGS_USERS_CANONICAL_PATH, { productLineId: "security" })?.whatIsThisPage).toBe(
      SECURENOW_USERS_ADMIN.whatIsThisPage,
    );
    expect(contextualHelpForPathname(INVITE_REVIEWER_CANONICAL_PATH, { productLineId: "security" })?.whatIsThisPage).toBe(
      SECURENOW_INVITE_REVIEWER.whatIsThisPage,
    );
    expect(
      contextualHelpForPathname(INVITE_REVIEWER_CANONICAL_PATH, { productLineId: "security" })?.whatIsThisPage,
    ).not.toMatch(/sign off on architecture reviews/i);
    expect(contextualHelpForPathname(USERS_AND_ROLES_HELP_CANONICAL_PATH, { productLineId: "security" })?.whatIsThisPage).toBe(
      SECURENOW_USERS_AND_ROLES_HELP.whatIsThisPage,
    );
    expect(
      contextualHelpForPathname("/security/assigned-to-me", { productLineId: "security" })?.whatIsThisPage,
    ).not.toContain("architecture risks");
  });

  it("keeps architecture findings contextual help unchanged", () => {
    expect(contextualHelpForPathname("/governance/findings", { productLineId: "architecture" })?.whatIsThisPage).toContain(
      "architecture risks",
    );
  });

  it("resolves assigned-to-me contextual help without tenant register or approval copy", () => {
    const architectureAssigned = contextualHelpForPathname("/governance/findings/assigned-to-me", {
      productLineId: "architecture",
    });
    const securityAssignedGovernance = contextualHelpForPathname("/governance/findings/assigned-to-me", {
      productLineId: "security",
    });
    const securityAssignedShell = contextualHelpForPathname("/security/assigned-to-me", {
      productLineId: "security",
    });

    expect(architectureAssigned?.whatIsThisPage).toContain("personal queue");
    expect(architectureAssigned?.whatIsThisPage).not.toContain("architecture risks");
    expect(architectureAssigned?.whatIsThisPage).not.toMatch(/approval queue/i);

    expect(securityAssignedGovernance?.whatIsThisPage).toBe(SECURENOW_ASSIGNED_TO_ME_FINDINGS.whatIsThisPage);
    expect(securityAssignedShell?.whatIsThisPage).toBe(SECURENOW_ASSIGNED_TO_ME_FINDINGS.whatIsThisPage);
    expect(securityAssignedGovernance?.whatIsThisPage).not.toContain("architecture risks");
  });

  it("uses workspace-scoped standards and rules help for SecureNow", () => {
    expect(standardsRulesHelpPageSubtitle(false, "security")).toContain("workspace scope");
    expect(standardsRulesHelpOverview("security")).not.toContain("review in scope");
    expect(standardsRulesHelpHowToReadSteps("security").join(" ")).toContain("workspace scope");
    expect(standardsRulesHelpOverview("architecture")).toContain("Standards & rules resolution view");
  });

  it("resolves SecureNow policy packs contextual help without review-baseline language", () => {
    const complianceHub = contextualHelpForPathname("/compliance/policy-packs", { productLineId: "security" });
    const governanceHub = contextualHelpForPathname("/governance/policy-packs", { productLineId: "security" });
    const architectureHub = contextualHelpForPathname("/governance/policy-packs", { productLineId: "architecture" });

    expect(complianceHub?.whatIsThisPage).toBe(SECURENOW_POLICY_PACKS_HUB.whatIsThisPage);
    expect(governanceHub?.whatIsThisPage).toBe(SECURENOW_POLICY_PACKS_HUB.whatIsThisPage);
    expect(complianceHub?.whatToDoNext).not.toMatch(/review baseline/i);
    expect(complianceHub?.whatToDoNext).not.toMatch(/starting a review/i);
    expect(complianceHub?.whereToConfigureAction?.href).toBe("/compliance/findings");
    expect(architectureHub?.whatToDoNext).toMatch(/review/i);
  });

  it("resolves SecureNow cloud connections contextual help without multi-cloud or review CTAs", () => {
    const hubHelp = contextualHelpForPathname("/integrations/cloud-connections", { productLineId: "security" });
    const articleHelp = contextualHelpForPathname("/help/cloud-connections", { productLineId: "security" });
    const architectureHub = contextualHelpForPathname("/integrations/cloud-connections", {
      productLineId: "architecture",
    });

    expect(hubHelp?.whatIsThisPage).toBe(SECURENOW_CLOUD_CONNECTIONS_HUB.whatIsThisPage);
    expect(hubHelp?.whatToDoNext).not.toMatch(/choose platforms/i);
    expect(hubHelp?.whatToDoNext).not.toMatch(/evidence-only review/i);
    expect(hubHelp?.whereToConfigureAction?.href).toContain("manual-upload");
    expect(articleHelp?.whatIsThisPage).toBe(SECURENOW_CLOUD_CONNECTIONS_HELP.whatIsThisPage);
    expect(articleHelp?.whatIsThisPage).not.toMatch(/AWS|GCP/i);
    expect(architectureHub?.whatToDoNext).toMatch(/evidence-only review/i);
  });

  it("resolves SecureNow standards and rules contextual help for workspace scope", () => {
    const complianceHub = contextualHelpForPathname("/compliance/standards-and-rules", { productLineId: "security" });
    const architectureHub = contextualHelpForPathname("/governance/standards-and-rules", {
      productLineId: "architecture",
    });

    expect(complianceHub?.whatIsThisPage).toBe(SECURENOW_STANDARDS_RULES_HUB.whatIsThisPage);
    expect(complianceHub?.whatIsThisPage).not.toMatch(/applied to a review/i);
    expect(complianceHub?.whyEmpty).toContain("workspace scope");
    expect(architectureHub?.whatIsThisPage).toMatch(/applied to a review/i);
  });

  it("omits architecture-only user capabilities for SecureNow", () => {
    const capabilityIds = usersAndRolesCapabilityRows("security").map((row) => row.id);

    expect(capabilityIds).not.toContain("create-reviews");
    expect(capabilityIds).not.toContain("finalize-reviews");
    expect(capabilityIds).not.toContain("manage-billing");
    expect(usersAndRolesRoleOverview("security").find((role) => role.id === "Operator")?.summary).toContain(
      "findings",
    );
    expect(usersAndRolesFaq("security").find((item) => item.id === "billing")?.answer).toContain(
      "not administered in SecureNow",
    );
    expect(usersAndRolesCapabilityRows("architecture").map((row) => row.id)).toContain("manage-billing");
    expect(usersAndRolesCapabilityLabel("view-reviews", "security")).toContain("findings");
    expect(usersAndRolesCapabilityLabel("view-reviews", "security")).not.toContain("architectures");
    expect(usersAndRolesCapabilityRows("security").find((row) => row.id === "view-reviews")?.label).toContain(
      "findings",
    );
  });
});
