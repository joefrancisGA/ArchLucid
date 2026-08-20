import { resolveInAppDocHref } from "@/lib/in-app-doc-href";

/**
 * Engagement-metadata content for the public `/assurance-status` marketing page.
 *
 * This module is the single source of truth for the marketing page; it MUST stay
 * structurally aligned with the assurance posture table in
 * `docs/go-to-market/trust-center.md`. The page intentionally publishes
 * **engagement metadata only** — never redacted findings, never customer names —
 * so the NDA wall stays intact while procurement gets a current, dated reference.
 */

export type AssuranceMaturityTier = "available_now" | "during_diligence" | "planned_next";

export type AssuranceEngagementSummaryAccess = {
  readonly kind: "public" | "nda";
  readonly description: string;
  readonly href?: string;
};

export type AssuranceEngagementRow = {
  readonly id: string;
  readonly maturityTier: AssuranceMaturityTier;
  readonly engagement: string;
  readonly vendor: string;
  readonly scope: string;
  readonly completedUtc: string;
  readonly summaryAccess: AssuranceEngagementSummaryAccess;
};

export const securityTrustEngagementRows: ReadonlyArray<AssuranceEngagementRow> = [
  {
    id: "owner-security-self-assessment-2026",
    maturityTier: "available_now",
    engagement: "Control mapping aligned to SOC 2 criteria",
    vendor: "ArchLucid internal security ownership",
    scope:
      "STRIDE-aligned control review mapped to SOC 2 Common Criteria themes — readiness artifact for procurement questionnaires",
    completedUtc: "2026-Q2 (rolling updates)",
    summaryAccess: {
      kind: "public",
      description: "SOC\u00A02 readiness summary (public excerpt)",
      href: resolveInAppDocHref("docs/security/SOC2_SELF_ASSESSMENT_2026.md"),
    },
  },
  {
    id: "accessibility-self-attestation-2026-04-22",
    maturityTier: "available_now",
    engagement: "Accessibility self-attestation review",
    vendor: "ArchLucid accessibility custodians",
    scope: "WCAG 2.2 Level AA targets on primary operator routes with automated checks in CI",
    completedUtc: "2026-04-22",
    summaryAccess: {
      kind: "public",
      description: "Accessibility statement",
      href: "/accessibility",
    },
  },
  {
    id: "internal-security-assessment-2026-q2",
    maturityTier: "during_diligence",
    engagement: "Internal security assessment",
    vendor: "ArchLucid internal security program",
    scope:
      "Application data-handling paths, administrative interfaces, HTTPS API behaviors, with a documented control review process",
    completedUtc: "Interim summary available during diligence; final internal assessment summary to follow",
    summaryAccess: {
      kind: "nda",
      description: "Summary available during due diligence.",
    },
  },
  {
    id: "chaos-game-day-quarterly-staging-2026",
    maturityTier: "during_diligence",
    engagement: "Quarterly staging resilience exercise",
    vendor: "ArchLucid platform operations",
    scope:
      "Staging-only fault-injection exercises for operator practices. Broader production resilience follows customer deployment architecture and contractual operating model.",
    completedUtc: "Exercise scheduled — interim exercise log available; facilitation summary after the run",
    summaryAccess: {
      kind: "public",
      description: "Resilience exercise summary",
      href: resolveInAppDocHref("docs/quality/game-day-log/README.md"),
    },
  },
  {
    id: "pen-test-third-party-planned",
    maturityTier: "planned_next",
    engagement: "Planned next assurance cycle — independent third-party penetration test",
    vendor: "Independent third-party assessment planned for the next assurance cycle",
    scope:
      "Hosted product API, application and administrative interfaces, and primary data-handling paths (scope and schedule managed through the assurance cycle)",
    completedUtc: "Planned — next assurance cycle",
    summaryAccess: {
      kind: "nda",
      description: "Redacted summary when available — contact security@archlucid.net",
    },
  },
];

export const SECURITY_TRUST_MATURITY_SECTION_HEADINGS: Readonly<
  Record<AssuranceMaturityTier, { readonly id: string; readonly title: string; readonly intro: string }>
> = {
  available_now: {
    id: "security-trust-available-now",
    title: "Publicly available",
    intro: "Published summaries and artifacts for initial security review.",
  },
  during_diligence: {
    id: "security-trust-during-diligence",
    title: "Available under NDA",
    intro: "Detailed materials shared after diligence intake and confidentiality review.",
  },
  planned_next: {
    id: "security-trust-planned-next",
    title: "Planned",
    intro: "Scheduled assurance work in the next review cycle.",
  },
};

export const SECURITY_TRUST_NDA_NOTICE =
  "Detailed third-party test reports and quantitative findings are shared under NDA when available. This page summarizes what you can review today and how to request additional materials.";

export const SECURITY_TRUST_SOC2_READINESS_FOOTNOTE = "Not a SOC 2 attestation report.";

export const SECURITY_TRUST_HERO_SUPPORTING =
  "Review ArchLucid’s current assurance posture, public security materials, and due-diligence process.";

export type SecurityTrustEvidenceGroup = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly examples: readonly string[];
};

export const SECURITY_TRUST_EVIDENCE_GROUPS: readonly SecurityTrustEvidenceGroup[] = [
  {
    id: "public",
    title: "Publicly available",
    summary: "Artifacts you can reference during initial security and procurement review.",
    examples: [
      "SOC 2 readiness summary excerpt and accessibility statement",
      "Published data-handling posture and architecture documentation",
      "Trust Center evidence summaries",
    ],
  },
  {
    id: "nda",
    title: "Available under NDA",
    summary: "Detailed reports and findings shared after diligence intake.",
    examples: [
      "Internal security assessment summaries",
      "Questionnaire responses and control evidence packs",
    ],
  },
  {
    id: "on-request",
    title: "Available on request",
    summary: "Materials coordinated through your security contact after diligence intake.",
    examples: [
      "Subprocessor and tenancy detail for active evaluations",
      "Secure disclosure and encrypted communication instructions",
    ],
  },
  {
    id: "planned",
    title: "Planned",
    summary: "Scheduled assurance work in the next review cycle.",
    examples: ["Independent third-party penetration test with redacted summary when complete"],
  },
] as const;

export type SecurityTrustSummaryColumn = {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly description: string;
  readonly href?: string;
  readonly linkLabel?: string;
};

export const SECURITY_TRUST_SUMMARY_COLUMNS: readonly SecurityTrustSummaryColumn[] = [
  {
    id: "public-evidence",
    title: "Public evidence",
    status: "Available now",
    description: "Buyer-ready summaries, accessibility attestation, and published control mapping.",
    href: "/trust",
    linkLabel: "View Trust Center",
  },
  {
    id: "nda-materials",
    title: "NDA materials",
    status: "Available under NDA",
    description: "Detailed security assessments and questionnaire responses after diligence intake.",
    href: "mailto:security@archlucid.net",
    linkLabel: "Request diligence materials",
  },
  {
    id: "next-cycle",
    title: "Next assurance cycle",
    status: "Planned",
    description: "Independent third-party penetration testing is scheduled for the next assurance cycle.",
  },
] as const;

export function assuranceEvidenceClassification(row: AssuranceEngagementRow): string {
  if (row.maturityTier === "planned_next") {
    return "Planned";
  }

  if (row.summaryAccess.kind === "public") {
    return "Public";
  }

  if (row.maturityTier === "during_diligence") {
    return "Available under NDA";
  }

  return "Available on request";
}

export function assuranceMaturityBadgeLabel(tier: AssuranceMaturityTier): string {
  switch (tier) {
    case "available_now":
      return "Available now";

    case "during_diligence":
      return "Available under NDA";

    case "planned_next":
      return "Planned";

    default:
      return tier;
  }
}
