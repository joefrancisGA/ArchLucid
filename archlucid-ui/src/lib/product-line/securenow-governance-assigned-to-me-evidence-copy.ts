import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SECURENOW_AUDIT_EVIDENCE_PATH } from "@/lib/audit-evidence-lineage-route";
import { SECURENOW_FINDINGS_PATH, SECURENOW_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { howProductWorksHelpSourceLink } from "@/lib/help/help-product-copy";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

/** SecureNow assigned-to-me orientation links — no Architecture desk or marketing pricing routes. */
export const SECURENOW_GOVERNANCE_ASSIGNED_TO_ME_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Findings queue", href: SECURENOW_FINDINGS_PATH },
  { label: "Policy packs", href: SECURENOW_POLICY_PACKS_PATH },
  { label: "Audit evidence", href: SECURENOW_AUDIT_EVIDENCE_PATH },
  { label: "Findings help", href: inAppHelpHref("findings") },
  howProductWorksHelpSourceLink("security"),
];

export function governanceAssignedToMeOrientationSourcesForProductLine(
  productLineId: ProductLineId,
): readonly EvidenceSourceLink[] {
  if (productLineId === "security") {
    return SECURENOW_GOVERNANCE_ASSIGNED_TO_ME_ORIENTATION_SOURCES;
  }

  return [];
}
