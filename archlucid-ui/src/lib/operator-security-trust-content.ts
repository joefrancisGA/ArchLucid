import { resolveInAppDocHref } from "@/lib/in-app-doc-href";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";

export type OperatorSecurityTrustLinkItem = {
  readonly label: string;
  readonly href: string;
};

/** Procurement-facing materials available without NDA. */
export const OPERATOR_SECURITY_TRUST_AVAILABLE_NOW_ITEMS: ReadonlyArray<OperatorSecurityTrustLinkItem> = [
  { label: "Trust Center", href: "/trust" },
  { label: "Security policies", href: "/trust?focus=security-review" },
  { label: "DPA template", href: resolveInAppDocHref("docs/go-to-market/DPA_TEMPLATE.md") },
  { label: "Subprocessors", href: resolveInAppDocHref("docs/go-to-market/SUBPROCESSORS.md") },
  {
    label: "SOC 2 self-assessment",
    href: resolveInAppDocHref("docs/security/SOC2_SELF_ASSESSMENT_2026.md"),
  },
  { label: "CAIQ / SIG response", href: resolveInAppDocHref("docs/security/CAIQ_LITE_2026.md") },
  {
    label: "Procurement contact",
    href: "mailto:security@archlucid.net?subject=ArchLucid%20security%20review",
  },
];

export const OPERATOR_SECURITY_TRUST_NDA_INTRO =
  "Redacted penetration-test summaries and diligence-only assessment summaries are available under NDA when approved for distribution.";

export const OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_TITLE = "Tenant isolation model";

/** Soft isolation claims (TB-1284 / TB-1122 safe-to-claim) — no absolute “no cross-tenant path anywhere.” */
export const OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_BODY =
  "Each workspace is bound to a dedicated database catalog. Tenant identity is decided once at the host boundary, and API requests carry a tenant scope that the data layer enforces on tenant-facing queries. That is the standard customer path — not a claim that every staff or platform surface is free of cross-tenant aggregation. For questionnaire detail, use the CAIQ / SIG response and Trust Center isolation materials.";

/** In-app CAIQ doc — references tenant isolation evidence for procurement reviewers. */
export const OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_DETAIL_HREF = resolveInAppDocHref(
  "docs/security/CAIQ_LITE_2026.md",
);

export const OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_DETAIL_LABEL = "CAIQ / SIG response";

export const OPERATOR_SECURITY_TRUST_DATA_RETENTION_TITLE = "Data retention";

export const OPERATOR_SECURITY_TRUST_DATA_RETENTION_NOTE =
  "Architecture review data is retained for the duration of your workspace subscription. After termination, customer data is deleted within 90 days, except where retention is required by law or documented backup cycles.";

export const OPERATOR_SECURITY_TRUST_DATA_RETENTION_DELETION_INSTRUCTION =
  "Contact security@archlucid.net to request workspace data deletion.";

export const OPERATOR_SECURITY_TRUST_DATA_RETENTION_DPA_HREF = resolveInAppDocHref(
  "docs/go-to-market/DPA_TEMPLATE.md",
);

export const OPERATOR_SECURITY_TRUST_DATA_RETENTION_DPA_LABEL = "DPA template";

export const OPERATOR_SECURITY_TRUST_DATA_RETENTION_PRIVACY_HREF = "/privacy";

export const OPERATOR_SECURITY_TRUST_DATA_RETENTION_PRIVACY_LABEL = "Privacy policy";

export const OPERATOR_SECURITY_TRUST_NDA_EMAIL = "security@archlucid.net";

export const OPERATOR_SECURITY_TRUST_ROADMAP_ITEMS: ReadonlyArray<string> = [
  "SOC 2 Type II readiness and audit engagement planning",
  "ISO 27001 alignment documentation",
  "Automated compliance evidence export for procurement packs",
];

export type OperatorSecurityTrustMaturityTag = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
  readonly legendMeaning: string;
};

/** Shared StatusTag vocabulary for section headers and the badge legend (TB-1285 / TB-1286). */
export const OPERATOR_SECURITY_TRUST_MATURITY_TAG_AVAILABLE_NOW: OperatorSecurityTrustMaturityTag = {
  kind: "ready",
  label: "Available now",
  legendMeaning: "Active and accessible without NDA.",
};

export const OPERATOR_SECURITY_TRUST_MATURITY_TAG_UNDER_NDA: OperatorSecurityTrustMaturityTag = {
  kind: "neutral",
  label: "Under NDA",
  legendMeaning: "Shared under NDA; report body not published publicly.",
};

export const OPERATOR_SECURITY_TRUST_MATURITY_TAG_ROADMAP: OperatorSecurityTrustMaturityTag = {
  kind: "draft",
  label: "Roadmap",
  legendMeaning: "Planned; not yet available.",
};

export const OPERATOR_SECURITY_TRUST_MATURITY_TAGS: ReadonlyArray<OperatorSecurityTrustMaturityTag> = [
  OPERATOR_SECURITY_TRUST_MATURITY_TAG_AVAILABLE_NOW,
  OPERATOR_SECURITY_TRUST_MATURITY_TAG_UNDER_NDA,
  OPERATOR_SECURITY_TRUST_MATURITY_TAG_ROADMAP,
];
