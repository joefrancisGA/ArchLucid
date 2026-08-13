import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import type { EvidenceDiligenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { HELP_DILIGENCE_ARTIFACT_INDEX_TITLE } from "@/lib/help/help-diligence-artifact-index";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_CANONICAL_PATH = "/help/data-handling" as const;

export const DATA_HANDLING_TENANT_ISOLATION_HELP_TOPIC_LABEL = "How data handling and tenant isolation work" as const;

export const DATA_HANDLING_TENANT_ISOLATION_HELP_CLAIM_DISCIPLINE =
  "This page explains how ArchLucid handles review evidence and enforces tenant scope. It is architect orientation, and it is not a countersigned DPA.";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_INTRO =
  "Artifact index for isolation, signed review record, and audit trail claims that need a cite trail beyond this guide.";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_DISCLOSURE_TITLE =
  HELP_DILIGENCE_ARTIFACT_INDEX_TITLE;

export type DataHandlingTenantIsolationHelpSourceLink = EvidenceDiligenceSourceLink;

/** Operator diligence cites — no self-href to `/help/data-handling`. */
export const DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES: readonly EvidenceDiligenceSourceLink[] = [
  {
    label: "Trust Center",
    href: "/trust",
    evidences: "Public assurance downloads and procurement posture summaries",
    access: "Public marketing site",
  },
  {
    label: "Security and trust",
    href: inAppHelpHref("security-trust"),
    evidences: "Isolation layers, assurance materials, and diligence index",
    access: "Signed-in help",
  },
  {
    label: "Subprocessors",
    href: inAppHelpHref("subprocessors"),
    evidences: "Hosted processing partners and residency notes",
    access: "Signed-in help",
  },
  {
    label: "DPA template",
    href: inAppHelpHref("dpa-template"),
    evidences: "Data processing agreement starting point",
    access: "Signed-in help",
  },
  {
    label: "Signed review record",
    href: inAppHelpHref("review-packages"),
    evidences: "Governed review outputs retained in your tenant",
    access: "Tenant workspace",
  },
  {
    label: "Audit trail",
    href: GOVERNANCE_AUDIT_PATH,
    evidences: "Append-only governed-action events in your tenant",
    access: "Tenant workspace",
  },
] as const;
