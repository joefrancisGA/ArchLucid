import { describe, expect, it } from "vitest";

import { contextualHelpForPathname } from "@/lib/contextual-help-registry";
import { GOVERNANCE_INFRASTRUCTURE_PATH, GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

describe("SecureNow contextual help (SH-01)", () => {
  it("resolves Security home drawer copy without architecture review language", () => {
    const entry = contextualHelpForPathname("/", { productLineId: "security" });

    expect(entry).not.toBeNull();
    expect(entry?.whatIsThisPage).toContain("Security");
    expect(entry?.whatIsThisPage).toContain("ARC-AMPE");
    expect(entry?.whatIsThisPage).toContain("Infrastructure");
    expect(entry?.whatToDoNext).toContain("assigned to you");
    expect(entry?.whatToDoNextAction?.href).toBe("/governance/findings/assigned-to-me");
    expect(entry?.whatIsThisPage).not.toMatch(/architecture identity/i);
    expect(entry?.whatToDoNext).not.toMatch(/start a review/i);
    expect(entry?.whatToDoNextAction?.href).not.toContain("/architecture/reviews");
    expect(entry?.whereToConfigureAction?.href).not.toContain("/architecture/reviews");
  });

  it("keeps Architecture home contextual help unchanged", () => {
    const entry = contextualHelpForPathname("/", { productLineId: "architecture" });

    expect(entry?.whatIsThisPage).toContain("create or review an architecture");
    expect(entry?.whatToDoNext).toContain("Create architecture");
    expect(entry?.whatToDoNextAction?.href).toContain("/architecture/");
  });

  it("does not apply Architecture working-mode home override in the Security shell", () => {
    const securityWorkingHome = contextualHelpForPathname("/", {
      productLineId: "security",
      workingMode: true,
    });
    const architectureWorkingHome = contextualHelpForPathname("/", {
      productLineId: "architecture",
      workingMode: true,
    });

    expect(securityWorkingHome?.whatIsThisPage).toContain("Security");
    expect(securityWorkingHome?.whatIsThisPage).not.toContain("architecture identities");
    expect(architectureWorkingHome?.whatIsThisPage).toContain("architecture identities");
  });

  it("maps Security home Learn more to getting-started instead of first-architecture-review", () => {
    expect(pageHelpTopicForPathname("/", "security")?.slug).toBe("getting-started");
    expect(pageHelpTopicForPathname("/", "architecture")?.slug).toBe("first-architecture-review");
  });

  it("maps remediation factory Learn more away from governance-approval in Security", () => {
    expect(pageHelpTopicForPathname("/governance/remediation-factory", "security")?.slug).toBe(
      "remediation-factory",
    );
    expect(pageHelpTopicForPathname("/governance/remediation-factory", "architecture")?.slug).toBe(
      "governance-approval",
    );
  });

  it("uses exact-match infrastructure overview Learn more without stealing child routes", () => {
    expect(pageHelpTopicForPathname(GOVERNANCE_INFRASTRUCTURE_PATH, "security")?.slug).toBe(
      "governance-infrastructure-overview",
    );
    expect(pageHelpTopicForPathname(GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH, "security")?.slug).toBeUndefined();
    expect(pageHelpTopicForPathname(GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH, "security")?.label).toBe(
      "Resource explorer",
    );
    expect(pageHelpTopicForPathname(GOVERNANCE_INFRASTRUCTURE_PATH, "architecture")?.slug).toBe("cloud-connections");
    expect(pageHelpTopicForPathname(GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH, "architecture")?.slug).toBe(
      "cloud-connections",
    );
  });
});
