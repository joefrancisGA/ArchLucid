import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { infrastructureResourcesPathForProductLine } from "@/lib/product-line/securenow-infrastructure-resources-route";
import { localizeEvidenceSourceLinks } from "@/lib/product-line/securenow-evidence-navigation";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

export const AUDIT_EVIDENCE_SOURCES_INTRO =
  "Use audit trail activity and infrastructure inventory when you need context before opening a control lineage.";

export const AUDIT_EVIDENCE_CONTROL_LINEAGE_SOURCES_INTRO =
  "Use these surfaces when procurement asks for context beyond this control chain, or when IDs need verification.";

/** Operator Sources for audit evidence lookup (GOU). */
export const AUDIT_EVIDENCE_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  {
    label: "Resource inventory",
    href: "/governance/infrastructure/resources",
    when: "Find assessment and control IDs linked from a cloud resource hub",
  },
  {
    label: "Audit trail",
    href: GOVERNANCE_AUDIT_PATH,
    when: "Follow workspace activity records when procurement asks for audit context",
  },
  {
    label: "Cloud connections help",
    href: inAppHelpHref("cloud-connections"),
    when: "Confirm inventory connectors before trusting snapshot exports",
  },
  {
    label: "Assurance status",
    href: "/assurance-status",
    when: "Read published assurance posture — not a substitute for this lineage spine",
  },
] as const;

export function auditEvidenceSourcesForProductLine(
  productLineId: ProductLineId,
): readonly EvidenceSourceLinkWithWhen[] {
  const resourceInventoryPath = infrastructureResourcesPathForProductLine(productLineId);
  const sources = AUDIT_EVIDENCE_SOURCES.map((source) =>
    source.href === "/governance/infrastructure/resources"
      ? { ...source, href: resourceInventoryPath }
      : source,
  );

  return localizeEvidenceSourceLinks(productLineId, sources) as readonly EvidenceSourceLinkWithWhen[];
}
