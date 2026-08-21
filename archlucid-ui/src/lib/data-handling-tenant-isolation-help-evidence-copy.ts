import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import type { EvidenceDiligenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { HELP_DILIGENCE_ARTIFACT_INDEX_TITLE } from "@/lib/help/help-diligence-artifact-index";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_CANONICAL_PATH = "/help/data-handling" as const;

export const DATA_HANDLING_TENANT_ISOLATION_HELP_TOPIC_LABEL = "How data handling and tenant isolation work" as const;

export const DATA_HANDLING_TENANT_ISOLATION_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide is not";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_CLAIM_HEADING_ID = "help-data-handling-claim-discipline-heading" as const;

export const DATA_HANDLING_TENANT_ISOLATION_HELP_CLAIM_DISCIPLINE =
  "This page explains how ArchLucid handles review evidence and enforces tenant scope. It is architect orientation, and it is not a countersigned DPA.";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_FOLLOW_UPS_TITLE = HELP_DILIGENCE_ARTIFACT_INDEX_TITLE;

export const DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_INTRO =
  "Use these follow-ups when isolation, finalized review record, or audit trail claims need a cite trail beyond this guide.";

export const DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_DISCLOSURE_TITLE =
  HELP_DILIGENCE_ARTIFACT_INDEX_TITLE;

export const DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_HEADING_ID = "related-diligence-artifacts" as const;

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
    label: "Finalized review record",
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

const DATA_HANDLING_TENANT_ISOLATION_HELP_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>(["/trust"]);

/** Orientation-strip Sources — excludes Trust Center when the header CTA already covers it. */
export const DATA_HANDLING_TENANT_ISOLATION_HELP_ORIENTATION_SOURCES: readonly EvidenceDiligenceSourceLink[] =
  DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES.filter(
    (source) => !DATA_HANDLING_TENANT_ISOLATION_HELP_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
  );
