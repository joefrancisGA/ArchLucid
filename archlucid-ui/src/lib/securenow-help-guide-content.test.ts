import { describe, expect, it } from "vitest";

import { contextualHelpForPathname } from "@/lib/contextual-help-registry";
import {
  SECURENOW_ASSIGNED_TO_ME_FINDINGS,
  SECURENOW_FINDINGS_QUEUE_HUB,
  SECURENOW_GETTING_STARTED_HELP,
  SECURENOW_TROUBLESHOOTING_HELP,
} from "@/lib/contextual-help/securenow-contextual-help-overrides";
import {
  resolveGettingStartedHelpSources,
  SECURENOW_GETTING_STARTED_HELP_SOURCES,
} from "@/lib/getting-started-help-guide-content";
import {
  findingsHelpOverview,
  findingsHelpPageSubtitle,
} from "@/lib/findings/findings-help-guide-content";
import { listHelpCenterFeaturedSlugs, listHelpCenterTopics } from "@/lib/help/help-center-catalog";
import { localizeHelpSearchPanelTopic } from "@/lib/help/help-product-copy";
import { START_HERE_TOPICS } from "@/lib/help/help-search-panel-catalog-topics";
import { policyPacksHelpDiagramSource } from "@/lib/policy/policy-packs-help-guide-content";
import {
  standardsRulesHelpHowToReadSteps,
  standardsRulesHelpOverview,
  standardsRulesHelpPageSubtitle,
} from "@/lib/standards-rules-help-guide-content";
import { troubleshootingCommonIssues } from "@/lib/troubleshooting-help-guide-content";
import {
  usersAndRolesCapabilityRows,
  usersAndRolesFaq,
  usersAndRolesRoleOverview,
} from "@/lib/users-and-roles-help-manifest";

describe("SecureNow help guide content", () => {
  it("uses SecureNow getting-started sources without architecture review CTAs", () => {
    const sources = resolveGettingStartedHelpSources("security");

    expect(sources).toEqual(SECURENOW_GETTING_STARTED_HELP_SOURCES);
    expect(sources.some((link) => link.href.includes("/architecture/reviews"))).toBe(false);
    expect(sources.some((link) => link.href.includes("first-architecture-review"))).toBe(false);
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
    expect(
      issues.flatMap((issue) => issue.nextSteps).some((step) => step.href.includes("/architecture/reviews")),
    ).toBe(false);
  });

  it("resolves SecureNow contextual help for findings and onboarding routes", () => {
    expect(contextualHelpForPathname("/governance/findings", { productLineId: "security" })?.whatIsThisPage).toBe(
      SECURENOW_FINDINGS_QUEUE_HUB.whatIsThisPage,
    );
    expect(
      contextualHelpForPathname("/governance/findings/assigned-to-me", { productLineId: "security" })?.whatIsThisPage,
    ).toBe(SECURENOW_ASSIGNED_TO_ME_FINDINGS.whatIsThisPage);
    expect(contextualHelpForPathname("/help/getting-started", { productLineId: "security" })?.whatIsThisPage).toBe(
      SECURENOW_GETTING_STARTED_HELP.whatIsThisPage,
    );
    expect(contextualHelpForPathname("/help/troubleshooting", { productLineId: "security" })?.whatIsThisPage).toBe(
      SECURENOW_TROUBLESHOOTING_HELP.whatIsThisPage,
    );
    expect(
      contextualHelpForPathname("/governance/findings/assigned-to-me", { productLineId: "security" })?.whatIsThisPage,
    ).not.toContain("architecture risks");
  });

  it("keeps architecture findings contextual help unchanged", () => {
    expect(contextualHelpForPathname("/governance/findings", { productLineId: "architecture" })?.whatIsThisPage).toContain(
      "architecture risks",
    );
  });

  it("uses workspace-scoped standards and rules help for SecureNow", () => {
    expect(standardsRulesHelpPageSubtitle(false, "security")).toContain("workspace scope");
    expect(standardsRulesHelpOverview("security")).not.toContain("review in scope");
    expect(standardsRulesHelpHowToReadSteps("security").join(" ")).toContain("workspace scope");
    expect(standardsRulesHelpOverview("architecture")).toContain("Standards & rules resolution view");
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
  });
});
