import { describe, expect, it } from "vitest";

import { contextualHelpForPathname } from "@/lib/contextual-help/registry";
import { AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH } from "@/lib/audit-evidence-lineage-route";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
  GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
  GOVERNANCE_INFRASTRUCTURE_PATH,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  SECURENOW_INFRASTRUCTURE_RESOURCES_PATH,
  GOVERNANCE_INFRASTRUCTURE_ASK_PATH,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH,
  SECURENOW_INFRASTRUCTURE_ASK_PATH,
  SECURENOW_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
  SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH,
  SECURENOW_INFRASTRUCTURE_TERRAFORM_PATH,
  SECURENOW_REMEDIATION_INSTANCES_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import {
  SECURENOW_REMEDIATION_FACTORY_PATH,
  SECURENOW_REMEDIATION_PATTERNS_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PAGE_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

describe("SecureNow governance contextual help rows", () => {
  it("does not resolve Approval copy for remediation factory", () => {
    const entry = contextualHelpForPathname(SECURENOW_REMEDIATION_FACTORY_PATH, { productLineId: "security" });

    expect(entry?.whatIsThisPage).toContain("Remediation factory");
    expect(entry?.whatIsThisPage).toContain("Advisory only");
    expect(entry?.whatIsThisPage).not.toContain("Approval");
    expect(entry?.whatToDoNextAction?.href).not.toContain("approval-queue");
    expect(pageHelpTopicForPathname(SECURENOW_REMEDIATION_FACTORY_PATH, "security")?.slug).toBe(
      "security-evidence-paths",
    );
  });

  it("does not resolve Approval copy for remediation patterns", () => {
    const entry = contextualHelpForPathname(SECURENOW_REMEDIATION_PATTERNS_PATH, { productLineId: "security" });

    expect(entry?.whatIsThisPage).toContain("Remediation patterns");
    expect(entry?.whatIsThisPage).toContain("Draft");
    expect(entry?.whatIsThisPage).not.toContain("approval queue");
    expect(pageHelpTopicForPathname(SECURENOW_REMEDIATION_PATTERNS_PATH, "security")?.slug).toBe(
      "remediation-patterns",
    );
  });

  it("does not resolve Approval copy for audit evidence lineage lookup or nested control path", () => {
    const lookup = contextualHelpForPathname(AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH, { productLineId: "security" });
    const nested = contextualHelpForPathname(
      `${AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH}/assess-1/snapshots/snap-2/controls/ctrl-3`,
      { productLineId: "security" },
    );

    expect(lookup?.whatIsThisPage).toContain("evidence lineage");
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

  it("does not resolve Approval copy for diagrams", () => {
    const entry = contextualHelpForPathname(SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH, { productLineId: "security" });

    expect(entry?.whatIsThisPage).toContain(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_TITLE);
    expect(entry?.whatIsThisPage).toContain("inventory");
    expect(entry?.whatIsThisPage).not.toContain("Approval");
    expect(entry?.whatIsThisPage).not.toMatch(/architecture.review/i);
    expect(pageHelpTopicForPathname(SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH, "security")?.slug).toBe(
      "governance-infrastructure-diagrams",
    );
    expect(pageHelpTopicForPathname(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH, "security")?.slug).toBe(
      "governance-infrastructure-diagrams",
    );
    expect(pageHelpTopicForPathname(SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH, "security")?.slug).not.toBe(
      "cloud-connections",
    );
    expect(pageHelpTopicForPathname(SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH, "security")?.slug).not.toBe(
      "architecture-intelligence",
    );
    expect(pageHelpTopicForPathname(SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH, "security")?.label).toBe(
      GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_TITLE,
    );
  });

  it("does not resolve Approval copy for diagram reconcile", () => {
    const entry = contextualHelpForPathname(SECURENOW_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH, {
      productLineId: "security",
    });

    expect(entry?.whatIsThisPage).toContain(GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PAGE_TITLE);
    expect(entry?.whatIsThisPage).toContain("correspondence");
    expect(entry?.whatIsThisPage).not.toContain("Approval");
    expect(entry?.whatIsThisPage).not.toMatch(/start a review with a diagram/i);
    expect(pageHelpTopicForPathname(SECURENOW_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH, "security")?.slug).toBe(
      "governance-infrastructure-diagram-reconcile",
    );
    expect(pageHelpTopicForPathname(GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH, "security")?.slug).toBe(
      "governance-infrastructure-diagram-reconcile",
    );
    expect(pageHelpTopicForPathname(SECURENOW_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH, "security")?.slug).not.toBe(
      "cloud-connections",
    );
    expect(pageHelpTopicForPathname(SECURENOW_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH, "security")?.slug).not.toBe(
      "architecture-intelligence",
    );
    expect(pageHelpTopicForPathname(SECURENOW_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH, "security")?.label).toBe(
      GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PAGE_TITLE,
    );
  });

  it("does not resolve Approval copy for infrastructure Ask", () => {
    const entry = contextualHelpForPathname(SECURENOW_INFRASTRUCTURE_ASK_PATH, { productLineId: "security" });

    expect(entry?.whatIsThisPage).toContain(GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_TITLE);
    expect(entry?.whatIsThisPage).toContain("citation");
    expect(entry?.whatIsThisPage).not.toContain("Approval");
    expect(entry?.whatToDoNext).not.toMatch(/ask review questions/i);
    expect(pageHelpTopicForPathname(SECURENOW_INFRASTRUCTURE_ASK_PATH, "security")?.slug).toBe(
      "governance-infrastructure-ask",
    );
    expect(pageHelpTopicForPathname(GOVERNANCE_INFRASTRUCTURE_ASK_PATH, "security")?.slug).toBe(
      "governance-infrastructure-ask",
    );
    expect(pageHelpTopicForPathname(SECURENOW_INFRASTRUCTURE_ASK_PATH, "security")?.slug).not.toBe(
      "cloud-connections",
    );
    expect(pageHelpTopicForPathname(SECURENOW_INFRASTRUCTURE_ASK_PATH, "security")?.slug).not.toBe(
      "prior-manifest-retrieval",
    );
    expect(pageHelpTopicForPathname(SECURENOW_INFRASTRUCTURE_ASK_PATH, "security")?.label).toBe(
      GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_TITLE,
    );
  });

  it("does not resolve Approval copy for infrastructure remediation instances", () => {
    const entry = contextualHelpForPathname(SECURENOW_REMEDIATION_INSTANCES_PATH, { productLineId: "security" });

    expect(entry?.whatIsThisPage).toContain("Infrastructure remediation");
    expect(entry?.whatIsThisPage).toContain("instances and waves");
    expect(entry?.whatIsThisPage).not.toContain("Approval");
    expect(entry?.whatToDoNextAction?.href).not.toContain("approval-queue");
    expect(pageHelpTopicForPathname(SECURENOW_REMEDIATION_INSTANCES_PATH, "security")?.slug).toBe(
      "governance-infrastructure-remediation",
    );
    expect(pageHelpTopicForPathname(GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH, "security")?.slug).toBe(
      "governance-infrastructure-remediation",
    );
    expect(pageHelpTopicForPathname(SECURENOW_REMEDIATION_INSTANCES_PATH, "security")?.slug).not.toBe(
      "cloud-connections",
    );
    expect(pageHelpTopicForPathname(SECURENOW_REMEDIATION_INSTANCES_PATH, "security")?.label).toBe(
      GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PAGE_TITLE,
    );
  });

  it("resolves infrastructure workbench rows without Approval steal", () => {
    const terraform = contextualHelpForPathname(GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH, { productLineId: "security" });
    const resources = contextualHelpForPathname(SECURENOW_INFRASTRUCTURE_RESOURCES_PATH, { productLineId: "security" });
    const hub = contextualHelpForPathname(`${SECURENOW_INFRASTRUCTURE_RESOURCES_PATH}/resource-abc`, {
      productLineId: "security",
    });

    expect(terraform?.whatIsThisPage).toContain("Advisory Terraform");
    expect(terraform?.whatIsThisPage).not.toContain("Approval");
    expect(resources?.whatIsThisPage).toContain("Resource explorer");
    expect(hub?.whatIsThisPage).toContain("Resource evidence hub");
    expect(pageHelpTopicForPathname(GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH, "security")?.slug).toBe(
      "governance-infrastructure-terraform",
    );
    expect(pageHelpTopicForPathname(SECURENOW_INFRASTRUCTURE_TERRAFORM_PATH, "security")?.slug).toBe(
      "governance-infrastructure-terraform",
    );
    expect(pageHelpTopicForPathname(GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH, "security")?.slug).not.toBe(
      "cloud-connections",
    );
    expect(terraform?.whatToDoNext).not.toMatch(/start a review/i);
    expect(terraform?.whatToDoNextAction?.href).not.toContain("approval-queue");
    expect(pageHelpTopicForPathname(SECURENOW_INFRASTRUCTURE_RESOURCES_PATH, "security")?.slug).toBe(
      "governance-infrastructure-resources",
    );
    expect(
      pageHelpTopicForPathname(`${SECURENOW_INFRASTRUCTURE_RESOURCES_PATH}/resource-abc`, "security")?.slug,
    ).toBe("governance-infrastructure-resources");
    expect(pageHelpTopicForPathname(GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH, "architecture")?.slug).toBe(
      "governance-infrastructure-resources",
    );
    expect(pageHelpTopicForPathname(GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH, "security")?.slug).not.toBe(
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
    expect(entry?.whatToDoNextAction?.href).toBe(SECURENOW_INFRASTRUCTURE_RESOURCES_PATH);
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
    const factory = contextualHelpForPathname(SECURENOW_REMEDIATION_FACTORY_PATH, { productLineId: "security" });
    const workbench = contextualHelpForPathname(SECURENOW_REMEDIATION_INSTANCES_PATH, {
      productLineId: "security",
    });

    expect(factory?.whatIsThisPage).toContain("executive metrics");
    expect(workbench?.whatIsThisPage).toContain("instances and waves");
    expect(factory?.whatIsThisPage).not.toBe(workbench?.whatIsThisPage);
    expect(pageHelpTopicForPathname(SECURENOW_REMEDIATION_INSTANCES_PATH, "security")?.slug).toBe(
      "governance-infrastructure-remediation",
    );
    expect(pageHelpTopicForPathname(SECURENOW_REMEDIATION_FACTORY_PATH, "security")?.slug).not.toBe(
      "governance-infrastructure-remediation",
    );
  });
});
