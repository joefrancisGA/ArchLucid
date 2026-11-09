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
