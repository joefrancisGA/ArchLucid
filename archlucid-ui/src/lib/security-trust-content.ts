/**
 * Engagement-metadata content for the public `/security-trust` marketing page.
 *
 * This module is the single source of truth for the marketing page; it MUST stay
 * structurally aligned with the "Recent assurance activity" table in
 * `docs/go-to-market/TRUST_CENTER.md`. The page intentionally publishes
 * **engagement metadata only** — never redacted findings, never customer names —
 * so the NDA wall stays intact while procurement gets a current, dated reference.
 */

export type AssuranceEngagementSummaryAccess = {
  readonly kind: "public" | "nda";
  readonly description: string;
  readonly href?: string;
};

export type AssuranceEngagementRow = {
  readonly id: string;
  readonly engagement: string;
  readonly vendor: string;
  readonly scope: string;
  readonly completedUtc: string;
  readonly summaryAccess: AssuranceEngagementSummaryAccess;
};

export const securityTrustEngagementRows: ReadonlyArray<AssuranceEngagementRow> = [
  {
    id: "internal-security-assessment-2026-q2",
    engagement: "Internal security assessment (scheduled 2026-Q2 window)",
    vendor: "ArchLucid internal security program",
    scope: "Operator UI surface, HTTPS API behaviours, SaaS-aligned data-plane coverage with checklist discipline",
    completedUtc: "2026-Q2",
    summaryAccess: {
      kind: "nda",
      description: "Summary available under diligence — contact security@archlucid.net",
    },
  },
  {
    id: "pen-test-third-party-planned",
    engagement: "Independent third-party penetration testing",
    vendor: "Assessor to be selected — next assurance-cycle testing program",
    scope: "Hosted product API, operator UI, and primary data-plane paths (scope confirmed in executed Statement of Work)",
    completedUtc: "Planned",
    summaryAccess: {
      kind: "nda",
      description: "Redacted summary when available — contact security@archlucid.net",
    },
  },
  {
    id: "owner-security-self-assessment-2026",
    engagement: "Security & SOC 2 readiness self-assessment",
    vendor: "ArchLucid internal security ownership",
    scope: "STRIDE-aligned control review mapped to SOC&nbsp;2 Common Criteria themes (self-assessment — not CPA opinion)",
    completedUtc: "2026-Q2 (rolling updates)",
    summaryAccess: {
      kind: "public",
      description: "SOC&nbsp;2 readiness summary (public excerpt)",
      href: "https://github.com/joefrancisGA/ArchLucid/blob/main/docs/security/SOC2_SELF_ASSESSMENT_2026.md",
    },
  },
  {
    id: "accessibility-self-attestation-2026-04-22",
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
    id: "chaos-game-day-quarterly-staging-2026",
    engagement: "Quarterly staging resilience exercise",
    vendor: "ArchLucid platform operations",
    scope:
      "Staging fault-injection drills for operator practices; production resilience testing is governed by customer deployment architecture and contractual operating models.",
    completedUtc: "Calendar in published quality log",
    summaryAccess: {
      kind: "public",
      description: "Resilience exercise summary",
      href: "https://github.com/joefrancisGA/ArchLucid/blob/main/docs/quality/game-day-log/README.md",
    },
  },
];

export const SECURITY_TRUST_NDA_NOTICE =
  "Detailed third-party test reports and quantitative findings are shared under NDA when available. This page records status and how to request material during diligence.";

export const SECURITY_TRUST_REPO_TRUST_CENTER_URL =
  "https://github.com/joefrancisGA/ArchLucid/blob/main/docs/go-to-market/TRUST_CENTER.md";
