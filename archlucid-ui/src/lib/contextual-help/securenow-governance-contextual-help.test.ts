import { describe, expect, it } from "vitest";

import { contextualHelpForPathname } from "@/lib/contextual-help/registry";
import { AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH } from "@/lib/audit-evidence-lineage-route";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
  GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
  GOVERNANCE_INFRASTRUCTURE_PATH,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

const GOVERNANCE_REMEDIATION_FACTORY_PATH = "/governance/remediation-factory";
const GOVERNANCE_REMEDIATION_PATTERNS_PATH = "/governance/remediation-patterns";

describe("SecureNow governance contextual help rows", () => {
  it("does not resolve Approval copy for remediation factory", () => {
    const entry = contextualHelpForPathname(GOVERNANCE_REMEDIATION_FACTORY_PATH, { productLineId: "security" });

    expect(entry?.whatIsThisPage).toContain("Remediation factory");
    expect(entry?.whatIsThisPage).toContain("Advisory only");
    expect(entry?.whatIsThisPage).not.toContain("Approval");
    expect(entry?.whatToDoNextAction?.href).not.toContain("approval-queue");
    expect(pageHelpTopicForPathname(GOVERNANCE_REMEDIATION_FACTORY_PATH, "security")?.slug).toBe(
      "remediation-factory",
    );
  });

  it("does not resolve Approval copy for remediation patterns", () => {
    const entry = contextualHelpForPathname(GOVERNANCE_REMEDIATION_PATTERNS_PATH, { productLineId: "security" });

    expect(entry?.whatIsThisPage).toContain("Remediation patterns");
    expect(entry?.whatIsThisPage).toContain("Draft");
    expect(entry?.whatIsThisPage).not.toContain("approval queue");
    expect(pageHelpTopicForPathname(GOVERNANCE_REMEDIATION_PATTERNS_PATH, "security")?.slug).toBe(
      "remediation-patterns",
    );
  });

  it("does not resolve Approval copy for audit evidence lineage lookup or nested control path", () => {
    const lookup = contextualHelpForPathname(AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH, { productLineId: "security" });
    const nested = contextualHelpForPathname(
      `${AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH}/assess-1/snapshots/snap-2/controls/ctrl-3`,
      { productLineId: "security" },
    );

    expect(lookup?.whatIsThisPage).toContain("chain of custody");
    expect(lookup?.whatIsThisPage).not.toContain("Approval");
    expect(lookup?.whatIsThisPage).not.toContain("audit trail activity");
    expect(nested?.whatIsThisPage).toContain("Control chain of custody");
    expect(nested?.whatIsThisPage).not.toContain("Approval");
    expect(pageHelpTopicForPathname(AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH, "security")?.slug).toBe(
      "audit-evidence-lineage",
    );
  });

  it("uses infrastructure overview copy only on the exact hub path", () => {
    const overview = contextualHelpForPathname(GOVERNANCE_INFRASTRUCTURE_PATH, { productLineId: "security" });
    const drift = contextualHelpForPathname(GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH, { productLineId: "security" });

    expect(overview?.whatIsThisPage).toContain("Azure inventory evidence workbenches");
    expect(overview?.whatIsThisPage).not.toContain("Approval");
    expect(drift?.whatIsThisPage).toContain("drift");
    expect(drift?.whatIsThisPage).not.toContain("six destinations");
    expect(pageHelpTopicForPathname(GOVERNANCE_INFRASTRUCTURE_PATH, "security")?.slug).toBe(
      "governance-infrastructure-overview",
    );
    expect(pageHelpTopicForPathname(GOVERNANCE_INFRASTRUCTURE_PATH, "security")?.slug).not.toBe("cloud-connections");
    expect(pageHelpTopicForPathname(GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH, "security")?.slug).toBe(
      "governance-infrastructure-drift",
    );
  });

  it("resolves infrastructure workbench rows without Approval steal", () => {
    const terraform = contextualHelpForPathname(GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH, { productLineId: "security" });
    const resources = contextualHelpForPathname(GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH, { productLineId: "security" });
    const hub = contextualHelpForPathname(`${GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH}/resource-abc`, {
      productLineId: "security",
    });

    expect(terraform?.whatIsThisPage).toContain("Advisory Terraform");
    expect(terraform?.whatIsThisPage).not.toContain("Approval");
    expect(resources?.whatIsThisPage).toContain("Resource explorer");
    expect(hub?.whatIsThisPage).toContain("Resource evidence hub");
    expect(pageHelpTopicForPathname(GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH, "security")?.slug).not.toBe(
      "cloud-connections",
    );
  });

  it("uses Security extract-upload copy without architecture review CTAs", () => {
    const entry = contextualHelpForPathname(GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH, {
      productLineId: "security",
    });

    expect(entry?.whatIsThisPage).toContain("Extract and upload");
    expect(entry?.whatToDoNext).not.toContain("Start a review");
    expect(entry?.taskSteps?.join(" ")).not.toContain("Start a review");
    expect(entry?.whatToDoNextAction?.href).toBe(GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH);
    expect(pageHelpTopicForPathname(GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH, "security")?.slug).toBe(
      "cloud-connections-azure",
    );
    expect(pageHelpTopicForPathname(GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH, "security")?.slug).not.toBe(
      "evidence-intake",
    );
  });

  it("uses Azure-only drift prerequisite copy for Security and cloud account for Architecture", () => {
    const securityDrift = contextualHelpForPathname(GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH, { productLineId: "security" });
    const architectureDrift = contextualHelpForPathname(GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH, {
      productLineId: "architecture",
    });

    expect(securityDrift?.whereToConfigurePrerequisite).toContain("Azure");
    expect(securityDrift?.whereToConfigurePrerequisite).not.toMatch(/\bAWS\b|\bGCP\b/);
    expect(securityDrift?.taskSteps?.join(" ")).toContain("Azure");
    expect(architectureDrift?.whereToConfigurePrerequisite).toContain("cloud account");
  });

  it("keeps remediation factory and infrastructure remediation distinct", () => {
    const factory = contextualHelpForPathname(GOVERNANCE_REMEDIATION_FACTORY_PATH, { productLineId: "security" });
    const workbench = contextualHelpForPathname("/governance/infrastructure/remediation", {
      productLineId: "security",
    });

    expect(factory?.whatIsThisPage).toContain("executive metrics");
    expect(workbench?.whatIsThisPage).toContain("instances and waves");
    expect(factory?.whatIsThisPage).not.toBe(workbench?.whatIsThisPage);
  });
});
