/** Canonical operator routes for infrastructure evidence workbenches (IE-UX-00). */

export const GOVERNANCE_INFRASTRUCTURE_PATH = "/governance/infrastructure";

/** SecureNow shell — infrastructure overview hub (Infrastructure URL namespace). */
export const SECURENOW_INFRASTRUCTURE_PATH = "/infrastructure" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH = "/governance/infrastructure/drift";

/** SecureNow shell — drift workbench (Infrastructure URL namespace). */
export const SECURENOW_INFRASTRUCTURE_DRIFT_PATH = "/infrastructure/drift" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH = "/governance/infrastructure/diagrams";

/** SecureNow shell — inventory diagrams (same page, Infrastructure URL namespace). */
export const SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH = "/infrastructure/diagrams" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH =
  "/governance/infrastructure/diagram-reconcile";

/** SecureNow shell — diagram reconcile workbench (Infrastructure URL namespace). */
export const SECURENOW_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH = "/infrastructure/diagram-reconcile" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH = "/governance/infrastructure/resources";

/** SecureNow shell — resource explorer and evidence hubs (Infrastructure URL namespace). */
export const SECURENOW_INFRASTRUCTURE_RESOURCES_PATH = "/infrastructure/resources" as const;

export function governanceInfrastructureResourceHubPath(cloudResourceId: string): string {
  return `${GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH}/${cloudResourceId.trim()}`;
}

export const GOVERNANCE_INFRASTRUCTURE_ASK_PATH = "/governance/infrastructure/ask";

/** SecureNow shell — grounded Ask workbench (Infrastructure URL namespace). */
export const SECURENOW_INFRASTRUCTURE_ASK_PATH = "/infrastructure/ask" as const;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH = "/governance/infrastructure/remediation";

/** SecureNow Security shell — remediation instances workbench (Security URL namespace). */
export const SECURENOW_REMEDIATION_INSTANCES_PATH = "/security/remediation-instances" as const;

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH = "/governance/infrastructure/terraform";

/** SecureNow shell — advisory Terraform mapping workbench (Infrastructure URL namespace). */
export const SECURENOW_INFRASTRUCTURE_TERRAFORM_PATH = "/infrastructure/terraform" as const;

export const GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH =
  "/governance/infrastructure/extract-upload";

/** SecureNow shell — extract and upload intake (Infrastructure URL namespace). */
export const SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH = "/infrastructure/extract-upload" as const;

function pathMatchesInfrastructureNamespace(bare: string, basePath: string): boolean {
  return bare === basePath || bare.startsWith(`${basePath}/`);
}

export function isGovernanceInfrastructureRoutePath(pathname: string | null | undefined): boolean {
  if (pathname === null || pathname === undefined) {
    return false;
  }

  const bare = pathname.split("?", 1)[0] ?? pathname;

  return pathMatchesInfrastructureNamespace(bare, GOVERNANCE_INFRASTRUCTURE_PATH)
    || pathMatchesInfrastructureNamespace(bare, SECURENOW_INFRASTRUCTURE_PATH);
}

export function isGovernanceInfrastructureAskRoutePath(pathname: string | null | undefined): boolean {
  if (pathname === null || pathname === undefined) {
    return false;
  }

  const bare = pathname.split("?", 1)[0] ?? pathname;

  return pathMatchesInfrastructureNamespace(bare, GOVERNANCE_INFRASTRUCTURE_ASK_PATH)
    || pathMatchesInfrastructureNamespace(bare, SECURENOW_INFRASTRUCTURE_ASK_PATH);
}
