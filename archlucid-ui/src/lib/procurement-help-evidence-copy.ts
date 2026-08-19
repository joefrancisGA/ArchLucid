import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { buildCustomPolicyPackQuoteHref } from "@/lib/marketing-custom-policy-pack-authoring";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const PROCUREMENT_HELP_CANONICAL_PATH = "/help/procurement" as const;

export const PROCUREMENT_HELP_TOPIC_LABEL = "How procurement FAQ works" as const;

/** Matches `**Last reviewed:** 2026-07-29` in BUYER_SECURITY_PROCUREMENT_PACKET.md. */
export const PROCUREMENT_HELP_LAST_REVIEWED = "2026-07-29" as const;

export const PROCUREMENT_HELP_LAST_REVIEWED_LABEL = `Last reviewed ${PROCUREMENT_HELP_LAST_REVIEWED}` as const;

/** NDA-gated diligence materials and pack requests. */
export const PROCUREMENT_HELP_NDA_REQUEST_HREF = "/administration/security-trust" as const;

/** Sales-led quotes, references, and enterprise packaging. */
export const PROCUREMENT_HELP_SALES_CONTACT_HREF = "/pricing" as const;

export const PROCUREMENT_HELP_CUSTOM_POLICY_PACK_QUOTE_HREF =
  buildCustomPolicyPackQuoteHref("pricing-quote-request");

export const PROCUREMENT_HELP_LEAD =
  "Buyer-safe answers for InfoSec questionnaires, resilience reviews, and enterprise procurement.";

export const PROCUREMENT_HELP_CLAIM_DISCIPLINE =
  "This Procurement FAQ orients buyers and architects on diligence questions and pack requests — it is help orientation, not a CPA SOC 2 attestation, a published third-party pen-test report, or a sealed-review diligence Sources package from your tenant. Open Assurance status, Trust Center, or settings Security & Trust when you need live assurance surfaces or NDA request paths.";

export const PROCUREMENT_HELP_SOURCES_INTRO =
  "Use these follow-ups when procurement FAQ vocabulary turns into assurance hubs, isolation depth, or contract templates.";


/** Operator Sources — no self-href to `/help/procurement`. */
export const PROCUREMENT_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Trust Center", href: "/trust" },
  { label: "Security and trust help", href: inAppHelpHref("security-trust") },
  { label: "DPA template", href: inAppHelpHref("dpa-template") },
  { label: "Settings Security & Trust", href: "/administration/security-trust" },
] as const;

export type ProcurementHelpDiligenceCta = {
  readonly label: string;
  readonly href: string;
  readonly description: string;
  readonly testId: string;
};

/** First-viewport diligence ladder for `/help/procurement` (TB-1256). */
export const PROCUREMENT_HELP_DILIGENCE_PRIMARY_CTAS: readonly ProcurementHelpDiligenceCta[] = [
  {
    label: "Trust Center",
    href: "/trust",
    description: "Public assurance downloads and diligence contact paths.",
    testId: "procurement-help-diligence-trust-center",
  },
  {
    label: "Security and trust help",
    href: inAppHelpHref("security-trust"),
    description: "Assurance ladder, data handling, and procurement orientation.",
    testId: "procurement-help-diligence-security-trust-help",
  },
  {
    label: "DPA template",
    href: inAppHelpHref("dpa-template"),
    description: "Negotiation template for counsel — not a countersigned agreement.",
    testId: "procurement-help-diligence-dpa-template",
  },
  {
    label: "Subprocessors",
    href: inAppHelpHref("subprocessors"),
    description: "Current sub-processor list and objection commitments.",
    testId: "procurement-help-diligence-subprocessors",
  },
] as const;

export const PROCUREMENT_HELP_DILIGENCE_SECONDARY_CTAS: readonly ProcurementHelpDiligenceCta[] = [
  {
    label: "Request materials under NDA",
    href: PROCUREMENT_HELP_NDA_REQUEST_HREF,
    description: "Settings Security & Trust — NDA-gated diligence pack requests.",
    testId: "procurement-help-diligence-nda-request",
  },
  {
    label: "Contact sales for procurement pack",
    href: PROCUREMENT_HELP_SALES_CONTACT_HREF,
    description: "Sales-led quotes, references, and enterprise packaging.",
    testId: "procurement-help-diligence-sales-contact",
  },
] as const;
