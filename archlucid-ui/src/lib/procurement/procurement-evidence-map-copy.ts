import { ARCHLUCID_PROCUREMENT_ORDER_ACCEPTANCE_LEAD } from "@/lib/buyer-copy/archlucid-commercial-order-acceptance-copy";
import {
  PROCUREMENT_AL_EVAL_ANCHOR_HREF,
  PROCUREMENT_SN_EVAL_ANCHOR_HREF,
} from "@/lib/procurement/procurement-evidence-map-anchors";

export type ProcurementEvidenceArtifactStatus = "available" | "not-published";

export type ProcurementEvidenceArtifactRow = {
  readonly id: string;
  readonly label: string;
  readonly status: ProcurementEvidenceArtifactStatus;
  readonly href: string | null;
  readonly note: string;
};

export const PROCUREMENT_EVIDENCE_MAP_HEADING = "Procurement evidence map" as const;

export const PROCUREMENT_EVIDENCE_MAP_LEAD =
  "What exists today versus what is not published. Links open in-product surfaces — not a CPA attestation." as const;

export const ARCHLUCID_PROCUREMENT_EVIDENCE_MAP_LEAD = ARCHLUCID_PROCUREMENT_ORDER_ACCEPTANCE_LEAD;

export const SECURENOW_PROCUREMENT_EVIDENCE_ROWS: readonly ProcurementEvidenceArtifactRow[] = [
  {
    id: "trust-center",
    label: "Trust Center posture",
    status: "available",
    href: "/trust",
    note: "Security narrative and subprocessors.",
  },
  {
    id: "assurance-status",
    label: "Assurance status and self-assessment",
    status: "available",
    href: "/assurance-status",
    note: "SOC self-assessment honesty — not a CPA-issued SOC 2 report.",
  },
  {
    id: "reviewer-packet",
    label: "Reviewer packet and procurement index",
    status: "available",
    href: "/administration/securenow-reviewer-packet#procurement-index",
    note: "SKU meters, quote sequence, and controlled-pilot proposal anchors.",
  },
  {
    id: "dpa",
    label: "DPA template (help)",
    status: "available",
    href: "/help/dpa-template",
    note: "Template is not countersigned.",
  },
  {
    id: "quote",
    label: "Quote packet (published list price)",
    status: "available",
    href: "/administration/securenow-quote-packet",
    note: "SKU meters, quote sequence, and quote-only list prices.",
  },
  {
    id: "sn-eval-acceptance",
    label: "SN-EVAL controlled pilot acceptance",
    status: "available",
    href: PROCUREMENT_SN_EVAL_ANCHOR_HREF,
    note: "Quote packet anchors SN-EVAL acceptance language — not a countersigned order.",
  },
  {
    id: "soc2-cpa",
    label: "CPA-issued SOC 2 Type II report",
    status: "not-published",
    href: null,
    note: "Organizational program — not an in-product download.",
  },
  {
    id: "pen-test",
    label: "Third-party penetration test summary",
    status: "not-published",
    href: null,
    note: "Not published on Trust Center.",
  },
];

export const ARCHLUCID_PROCUREMENT_EVIDENCE_ROWS: readonly ProcurementEvidenceArtifactRow[] = [
  {
    id: "guided-pilot-order",
    label: "Guided-pilot evaluation order",
    status: "available",
    href: "/pricing#pricing-quote-request",
    note: "Accepted by signed quote at the published list price in pricing philosophy section 4.",
  },
  {
    id: "al-eval-acceptance",
    label: "AL-EVAL guided-pilot acceptance",
    status: "available",
    href: PROCUREMENT_AL_EVAL_ANCHOR_HREF,
    note: "Quote request anchors AL-EVAL acceptance language — not a countersigned order.",
  },
  {
    id: "monthly-tier-order",
    label: "Architect, Team, and Professional orders",
    status: "available",
    href: "/pricing",
    note: "Accepted at published list prices in section 5 by signed quote or order form.",
  },
  {
    id: "design-partner-order",
    label: "Design partner order",
    status: "available",
    href: "/pricing#pricing-quote-request",
    note: "Accepted when a design-partner slot is confirmed, by signed quote at the published terms in section 4.",
  },
  {
    id: "enterprise-evaluation-order",
    label: "Enterprise evaluation order",
    status: "available",
    href: "/pricing#pricing-quote-request",
    note: "Accepted by signed quote or custom order form.",
  },
  {
    id: "trial-conversion-order",
    label: "Trial-to-paid conversion",
    status: "available",
    href: "/pricing#pricing-quote-request",
    note: "Accepted by signed quote when converting from self-serve trial to a paid tier.",
  },
  {
    id: "custom-pack-order",
    label: "Custom evaluation or services pack",
    status: "available",
    href: "/pricing#pricing-quote-request",
    note: "Accepted by signed quote or custom order form when scoped. Stripe checkout is not published.",
  },
  {
    id: "stripe-checkout",
    label: "Stripe checkout",
    status: "not-published",
    href: null,
    note: "Authorized when engineering publishes Stripe Prices. Until then, quote and order form finalize payment terms.",
  },
  {
    id: "trust-center",
    label: "Trust Center posture",
    status: "available",
    href: "/trust",
    note: "Security narrative and subprocessors.",
  },
  {
    id: "assurance-status",
    label: "Assurance status and self-assessment",
    status: "available",
    href: "/assurance-status",
    note: "SOC self-assessment honesty — not a CPA-issued SOC 2 report.",
  },
  {
    id: "procurement-help",
    label: "Procurement help guide",
    status: "available",
    href: "/help/procurement",
    note: "Sources, claim discipline, and diligence CTAs.",
  },
  {
    id: "first-review",
    label: "First review guide (sample then policy pack)",
    status: "available",
    href: "/architecture/first-review-guide",
    note: "Sample architecture package is not a sealed tenant review.",
  },
  {
    id: "sealed-tenant",
    label: "Sealed tenant architecture review",
    status: "not-published",
    href: null,
    note: "You must start, evidence, and seal a review in your workspace — not done for you.",
  },
  {
    id: "soc2-cpa",
    label: "CPA-issued SOC 2 Type II report",
    status: "not-published",
    href: null,
    note: "Organizational program — not an in-product download.",
  },
  {
    id: "pen-test",
    label: "Third-party penetration test summary",
    status: "not-published",
    href: null,
    note: "Not published on Trust Center.",
  },
];
