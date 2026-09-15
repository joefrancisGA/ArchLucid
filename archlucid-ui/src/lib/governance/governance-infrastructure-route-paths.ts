/** Canonical operator routes for infrastructure evidence workbenches (IE-UX-00). */

export const GOVERNANCE_INFRASTRUCTURE_PATH = "/governance/infrastructure";

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH = "/governance/infrastructure/drift";

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH = "/governance/infrastructure/diagrams";

/** SecureNow shell — inventory diagrams (same page, Infrastructure URL namespace). */
export const SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH = "/infrastructure/diagrams" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH =
  "/governance/infrastructure/diagram-reconcile";

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH = "/governance/infrastructure/resources";

/** SecureNow shell — resource explorer and evidence hubs (Infrastructure URL namespace). */
export const SECURENOW_INFRASTRUCTURE_RESOURCES_PATH = "/infrastructure/resources" as const;

export function governanceInfrastructureResourceHubPath(cloudResourceId: string): string {
  return `${GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH}/${cloudResourceId.trim()}`;
}

export const GOVERNANCE_INFRASTRUCTURE_ASK_PATH = "/governance/infrastructure/ask";

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH = "/governance/infrastructure/remediation";

/** SecureNow Security shell — remediation instances workbench (Security URL namespace). */
export const SECURENOW_REMEDIATION_INSTANCES_PATH = "/security/remediation-instances" as const;

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH = "/governance/infrastructure/terraform";

export const GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH =
  "/governance/infrastructure/extract-upload";

export const GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH =
  "/governance/infrastructure/declared-connections";

export function isGovernanceInfrastructureRoutePath(pathname: string | null | undefined): boolean {
  if (pathname === null || pathname === undefined) {
    return false;
  }

  const bare = pathname.split("?", 1)[0] ?? pathname;

  return bare === GOVERNANCE_INFRASTRUCTURE_PATH || bare.startsWith(`${GOVERNANCE_INFRASTRUCTURE_PATH}/`);
}

export function isGovernanceInfrastructureAskRoutePath(pathname: string | null | undefined): boolean {
  if (pathname === null || pathname === undefined) {
    return false;
  }

  const bare = pathname.split("?", 1)[0] ?? pathname;

  return bare === GOVERNANCE_INFRASTRUCTURE_ASK_PATH || bare.startsWith(`${GOVERNANCE_INFRASTRUCTURE_ASK_PATH}/`);
}
