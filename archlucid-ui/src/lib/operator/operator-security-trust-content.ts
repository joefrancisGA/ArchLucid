import { resolveInAppDocHref } from "@/lib/in-app-doc-href";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import {
  getProductDocumentationEntry,
  inAppHelpHref,
  type ProductDocumentationEntry,
} from "@/lib/product-documentation-registry";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import {
  operatorSecurityTrustNdaRequestHref,
  operatorSecurityTrustSubprocessorsWhatItIs,
} from "@/lib/security-trust-product-copy";
import { assuranceMaturityBadgeLabel } from "@/lib/security-trust-content";

export type OperatorSecurityTrustLinkItem = {
  readonly label: string;
  readonly href: string;
};

export type OperatorSecurityTrustMaterialItem = {
  readonly label: string;
  readonly href: string;
  /** Registry slug for `lastReviewed` / `pdfStatus`; omit for non-help links. */
  readonly docSlug?: string;
  readonly whatItIs: string;
};

/** Primary Trust Center CTA — not duplicated in the materials inventory. */
export const OPERATOR_SECURITY_TRUST_PRIMARY_TRUST_CENTER_ITEM: OperatorSecurityTrustLinkItem = {
  label: "Trust Center",
  href: "/trust",
};

/** Procurement-facing materials available without NDA (excludes Trust Center primary CTA and Security policies duplicate). */
export function operatorSecurityTrustMaterialItems(
  productLineId: ProductLineId,
): ReadonlyArray<OperatorSecurityTrustMaterialItem> {
  return [
    {
      label: "DPA template",
      href: resolveInAppDocHref("docs/go-to-market/DPA_TEMPLATE.md"),
      docSlug: "dpa-template",
      whatItIs:
        "Data Processing Agreement template for contractual data-processing terms — requires legal review before execution.",
    },
    {
      label: "Subprocessors",
      href: resolveInAppDocHref("docs/go-to-market/SUBPROCESSORS.md"),
      docSlug: "subprocessors",
      whatItIs: operatorSecurityTrustSubprocessorsWhatItIs(productLineId),
    },
    {
      label: "SOC 2 self-assessment",
      href: resolveInAppDocHref("docs/security/SOC2_SELF_ASSESSMENT_2026.md"),
      docSlug: "soc2-self-assessment",
      whatItIs: "Internal readiness mapping aligned to SOC 2 Common Criteria — not a CPA attestation report.",
    },
    {
      label: "CAIQ / SIG pre-fill drafts",
      href: inAppHelpHref("caiq-sig-response"),
      docSlug: "caiq-sig-response",
      whatItIs:
        "Pre-filled CAIQ Lite themes and SIG Core families for procurement reviewers — transpose into your buyer workbook, not a completed STAR/SIG submission.",
    },
  ];
}

/** Architecture-shell default material inventory. */
export const OPERATOR_SECURITY_TRUST_MATERIAL_ITEMS: ReadonlyArray<OperatorSecurityTrustMaterialItem> =
  operatorSecurityTrustMaterialItems("architecture");

/** @deprecated Use OPERATOR_SECURITY_TRUST_PRIMARY_TRUST_CENTER_ITEM and OPERATOR_SECURITY_TRUST_MATERIAL_ITEMS. */
export const OPERATOR_SECURITY_TRUST_AVAILABLE_NOW_ITEMS: ReadonlyArray<OperatorSecurityTrustLinkItem> = [
  OPERATOR_SECURITY_TRUST_PRIMARY_TRUST_CENTER_ITEM,
  ...OPERATOR_SECURITY_TRUST_MATERIAL_ITEMS.map((item) => ({ label: item.label, href: item.href })),
];

export const OPERATOR_SECURITY_TRUST_NDA_SHARED_TODAY =
  "Diligence-only assessment summaries are shared under NDA on request.";

export const OPERATOR_SECURITY_TRUST_NDA_APPROVAL_ONLY =
  "Redacted penetration-test summaries are released only when approved for distribution.";

export const OPERATOR_SECURITY_TRUST_NDA_REQUEST_LABEL = "Request diligence materials";

export function operatorSecurityTrustNdaRequestHrefForProductLine(productLineId: ProductLineId): string {
  return operatorSecurityTrustNdaRequestHref(productLineId);
}

/** Architecture-shell default diligence mailto. */
export const OPERATOR_SECURITY_TRUST_NDA_REQUEST_HREF = operatorSecurityTrustNdaRequestHref("architecture");

/** @deprecated Prefer OPERATOR_SECURITY_TRUST_NDA_SHARED_TODAY and OPERATOR_SECURITY_TRUST_NDA_APPROVAL_ONLY. */
export const OPERATOR_SECURITY_TRUST_NDA_INTRO =
  "Redacted penetration-test summaries and diligence-only assessment summaries are available under NDA when approved for distribution.";

export const OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_TITLE = "Tenant isolation model";

export const OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_ENFORCED_LABEL = "What is enforced";

export const OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_ENFORCED_BODY =
  "Each workspace is bound to a dedicated database catalog. Tenant identity is decided once at the host boundary, and API requests carry a tenant scope that the data layer enforces on tenant-facing queries.";

export const OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_SCOPE_LABEL = "Scope of this claim";

/** Soft isolation claims (TB-1284 / TB-1122 safe-to-claim) — no absolute “no cross-tenant path anywhere.” */
export const OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_SCOPE_BODY =
  "That is the standard customer path — not a claim that every staff or platform surface is free of cross-tenant aggregation.";

export const OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_EVIDENCE_LABEL = "Evidence";

/** @deprecated Split into OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_* parts; kept for drift guards. */
export const OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_BODY = `${OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_ENFORCED_BODY} ${OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_SCOPE_BODY} For questionnaire pre-fill drafts, use the CAIQ / SIG help topic and Trust Center isolation materials.`;

/** In-app CAIQ / SIG specialty guide — references tenant isolation evidence for procurement reviewers. */
export const OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_DETAIL_HREF = inAppHelpHref("caiq-sig-response");

export const OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_DETAIL_LABEL = "CAIQ / SIG pre-fill drafts";

export const OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_AUDIT_TRAIL_HREF = resolveInAppDocHref(
  "docs/library/AUDIT_EVENT_MODEL.md",
);

export const OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_AUDIT_TRAIL_LABEL = "Audit trail help";

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

export const OPERATOR_SECURITY_TRUST_MATERIAL_REVIEWED_NOT_RECORDED = "Not recorded";

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
  label: assuranceMaturityBadgeLabel("available_now"),
  legendMeaning: "Active and accessible without NDA.",
};

export const OPERATOR_SECURITY_TRUST_MATURITY_TAG_UNDER_NDA: OperatorSecurityTrustMaturityTag = {
  kind: "in-progress",
  label: assuranceMaturityBadgeLabel("during_diligence"),
  legendMeaning: "Shared under NDA; report body not published publicly.",
};

export const OPERATOR_SECURITY_TRUST_MATURITY_TAG_ROADMAP: OperatorSecurityTrustMaturityTag = {
  kind: "draft",
  label: assuranceMaturityBadgeLabel("planned_next"),
  legendMeaning: "Planned; not yet available.",
};

export const OPERATOR_SECURITY_TRUST_MATURITY_TAGS: ReadonlyArray<OperatorSecurityTrustMaturityTag> = [
  OPERATOR_SECURITY_TRUST_MATURITY_TAG_AVAILABLE_NOW,
  OPERATOR_SECURITY_TRUST_MATURITY_TAG_UNDER_NDA,
  OPERATOR_SECURITY_TRUST_MATURITY_TAG_ROADMAP,
];

/** Registry-backed reviewed date — never invent or approximate. */
export function resolveOperatorSecurityTrustMaterialReviewedLabel(docSlug: string | undefined): string {
  if (docSlug === undefined || docSlug.trim().length === 0) {
    return OPERATOR_SECURITY_TRUST_MATERIAL_REVIEWED_NOT_RECORDED;
  }

  const entry = getProductDocumentationEntry(docSlug);

  if (entry === null || entry.lastReviewed === undefined || entry.lastReviewed.trim().length === 0) {
    return OPERATOR_SECURITY_TRUST_MATERIAL_REVIEWED_NOT_RECORDED;
  }

  return entry.lastReviewed;
}

/** Honest availability from registry `pdfStatus` — in-product `/help/*` is not a public download. */
export function resolveOperatorSecurityTrustMaterialAvailability(docSlug: string | undefined): string {
  if (docSlug === undefined || docSlug.trim().length === 0) {
    return " — ";
  }

  const entry = getProductDocumentationEntry(docSlug);

  if (entry === null) {
    return "In-product help topic";
  }

  return formatOperatorSecurityTrustMaterialAvailability(entry);
}

function formatOperatorSecurityTrustMaterialAvailability(entry: ProductDocumentationEntry): string {
  if (entry.pdfStatus === "public") {
    return "In-product help topic; PDF publicly available";
  }

  if (entry.pdfStatus === "customer") {
    return "In-product help topic; PDF for signed-in customers";
  }

  if (entry.pdfStatus === "internal") {
    return "In-product help topic; internal PDF only";
  }

  return "In-product help topic; no PDF";
}
