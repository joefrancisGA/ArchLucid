import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

/** Buyer-safe hierarchical merge diagram for `/help/policy-packs` (TB-2126). */

export const POLICY_PACKS_HELP_DIAGRAM_SUMMARY =
  "Policy packs are assigned at tenant, workspace, or project scope. Effective rules merge from the broadest assignment down to the most specific scope your review runs under.";

export const POLICY_PACKS_HELP_DIAGRAM_SOURCE = `flowchart TB
  subgraph content["Policy pack content"]
    DRAFT["Draft rules"]
    REVIEW["Review and approval"]
    PACK["Published pack<br/>rules and advisories"]
  end

  subgraph assign["Scope assignment"]
    T["Tenant assignment"]
    W["Workspace assignment"]
    P["Project assignment"]
  end

  subgraph resolve["Effective governance"]
    MERGE["Hierarchical merge<br/>tenant to workspace to project"]
    EFF["Effective rule set"]
  end

  subgraph apply["Review outcomes"]
    ENG["Governance evaluation"]
    FIND["Findings and alerts"]
    MAN["Finalized review record"]
  end

  DRAFT --> REVIEW --> PACK
  PACK --> T
  PACK --> W
  PACK --> P
  T --> MERGE
  W --> MERGE
  P --> MERGE
  MERGE --> EFF --> ENG
  ENG --> FIND
  ENG --> MAN`;

export const SECURENOW_POLICY_PACKS_HELP_DIAGRAM_SUMMARY =
  "Policy packs are assigned at tenant, workspace, or project scope. Effective rules merge from the broadest assignment down to the most specific scope before ARC-AMPE findings are raised against connected inventory.";

export const SECURENOW_POLICY_PACKS_HELP_DIAGRAM_SOURCE = `flowchart TB
  subgraph content["Policy pack content"]
    DRAFT["Draft rules"]
    REVIEW["Review and approval"]
    PACK["Published pack<br/>rules and advisories"]
  end

  subgraph assign["Scope assignment"]
    T["Tenant assignment"]
    W["Workspace assignment"]
    P["Project assignment"]
  end

  subgraph resolve["Effective governance"]
    MERGE["Hierarchical merge<br/>tenant to workspace to project"]
    EFF["Effective rule set"]
  end

  subgraph apply["Cloud evidence outcomes"]
    ENG["Governance evaluation"]
    FIND["Findings against inventory"]
    LINEAGE["Audit evidence lineage"]
  end

  DRAFT --> REVIEW --> PACK
  PACK --> T
  PACK --> W
  PACK --> P
  T --> MERGE
  W --> MERGE
  P --> MERGE
  MERGE --> EFF --> ENG
  ENG --> FIND
  ENG --> LINEAGE`;

export function policyPacksHelpDiagramSummary(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_POLICY_PACKS_HELP_DIAGRAM_SUMMARY
    : POLICY_PACKS_HELP_DIAGRAM_SUMMARY;
}

export function policyPacksHelpDiagramSource(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_POLICY_PACKS_HELP_DIAGRAM_SOURCE
    : POLICY_PACKS_HELP_DIAGRAM_SOURCE;
}
