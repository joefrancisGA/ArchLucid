/** Canonical operator routes for infrastructure evidence workbenches (IE-UX-00). */

export const GOVERNANCE_INFRASTRUCTURE_PATH = "/governance/infrastructure";

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH = "/governance/infrastructure/drift";

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH = "/governance/infrastructure/diagrams";

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH =
  "/governance/infrastructure/diagram-reconcile";

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH = "/governance/infrastructure/resources";

export function governanceInfrastructureResourceHubPath(cloudResourceId: string): string {
  return `${GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH}/${cloudResourceId.trim()}`;
}

export const GOVERNANCE_INFRASTRUCTURE_ASK_PATH = "/governance/infrastructure/ask";

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH = "/governance/infrastructure/remediation";

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH = "/governance/infrastructure/terraform";
