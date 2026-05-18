/**
 * Engagement-metadata content for the public `/security-trust` marketing page.
 *
 * This module is the single source of truth for the marketing page; it MUST stay
 * structurally aligned with the "Recent assurance activity" table in
 * `docs/go-to-market/TRUST_CENTER.md`. The page intentionally publishes
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
      href: "https://github.com/joefrancisGA/ArchLucid/blob/main/docs/security/SOC2_SELF_ASSESSMENT_2026.md",
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
      href: "https://github.com/joefrancisGA/ArchLucid/blob/main/docs/quality/game-day-log/README.md",
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
    title: "Available now",
    intro: "Public summaries and artifacts you can reference while scoping diligence.",
  },
  during_diligence: {
    id: "security-trust-during-diligence",
    title: "Available during diligence",
    intro: "Engagements in flight or summarized for procurement under confidentiality.",
  },
  planned_next: {
    id: "security-trust-planned-next",
    title: "Planned next assurance cycle",
    intro: "Scheduled or roadmap assurance work — timelines and scope align with your procurement calendar.",
  },
};

export const SECURITY_TRUST_NDA_NOTICE =
  "Detailed third-party test reports and quantitative findings are shared under NDA when available. This page records status and how to request material during diligence.";

export const SECURITY_TRUST_REPO_TRUST_CENTER_URL =
  "https://github.com/joefrancisGA/ArchLucid/blob/main/docs/go-to-market/TRUST_CENTER.md";

export const SECURITY_TRUST_SOC2_READINESS_FOOTNOTE = "Not a SOC 2 attestation report.";
