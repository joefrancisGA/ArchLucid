import {
  GOVERNANCE_INFRASTRUCTURE_ASK_PATH,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
  GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
  GOVERNANCE_INFRASTRUCTURE_PATH,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH,
  SECURENOW_INFRASTRUCTURE_ASK_PATH,
  SECURENOW_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
  SECURENOW_INFRASTRUCTURE_DRIFT_PATH,
  SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
  SECURENOW_INFRASTRUCTURE_PATH,
  SECURENOW_INFRASTRUCTURE_TERRAFORM_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

function infrastructurePathForProductLine(
  productLine: ProductLineId,
  governancePath: string,
  secureNowPath: string,
): string {
  if (productLine === "security") {
    return secureNowPath;
  }

  return governancePath;
}

/** Product-line canonical operator route for the infrastructure overview hub. */
export function infrastructureOverviewPathForProductLine(productLine: ProductLineId): string {
  return infrastructurePathForProductLine(
    productLine,
    GOVERNANCE_INFRASTRUCTURE_PATH,
    SECURENOW_INFRASTRUCTURE_PATH,
  );
}

/** Product-line canonical operator route for the drift workbench. */
export function infrastructureDriftPathForProductLine(productLine: ProductLineId): string {
  return infrastructurePathForProductLine(
    productLine,
    GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
    SECURENOW_INFRASTRUCTURE_DRIFT_PATH,
  );
}

/** Product-line canonical operator route for advisory Terraform mapping. */
export function infrastructureTerraformPathForProductLine(productLine: ProductLineId): string {
  return infrastructurePathForProductLine(
    productLine,
    GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH,
    SECURENOW_INFRASTRUCTURE_TERRAFORM_PATH,
  );
}

/** Product-line canonical operator route for diagram reconciliation. */
export function infrastructureDiagramReconcilePathForProductLine(productLine: ProductLineId): string {
  return infrastructurePathForProductLine(
    productLine,
    GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
    SECURENOW_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
  );
}

/** Product-line canonical operator route for grounded Infrastructure Ask. */
export function infrastructureAskPathForProductLine(productLine: ProductLineId): string {
  return infrastructurePathForProductLine(
    productLine,
    GOVERNANCE_INFRASTRUCTURE_ASK_PATH,
    SECURENOW_INFRASTRUCTURE_ASK_PATH,
  );
}

/** Product-line canonical operator route for extract and upload intake. */
export function infrastructureExtractUploadPathForProductLine(productLine: ProductLineId): string {
  return infrastructurePathForProductLine(
    productLine,
    GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
    SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
  );
}
