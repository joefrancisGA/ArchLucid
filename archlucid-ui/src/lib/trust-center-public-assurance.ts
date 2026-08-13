import { resolveInAppDocHref } from "@/lib/in-app-doc-href";

/** Anonymous procurement ZIP — same endpoint as Welcome / Why comparison surfaces (TB-721). */
export const TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF = "/v1/marketing/trust-center/evidence-pack.zip" as const;

export type TrustPublicAssuranceArtifact = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly href: string;
};

/** Public-safe assurance artifacts linked from `/trust` without authentication. */
export const TRUST_PUBLIC_ASSURANCE_ARTIFACTS: readonly TrustPublicAssuranceArtifact[] = [
  {
    id: "evidence-pack-zip",
    title: "Procurement evidence pack (ZIP)",
    description:
      "Anonymous download — DPA template, subprocessors, CAIQ Lite, SIG Core, SOC 2 self-assessment, owner-conducted pen-test summary, and audit coverage index.",
    href: TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF,
  },
  {
    id: "soc2-self-assessment",
    title: "SOC 2 self-assessment",
    description: "Internal readiness mapping aligned to Common Criteria — not a CPA attestation report.",
    href: resolveInAppDocHref("docs/security/SOC2_SELF_ASSESSMENT_2026.md"),
  },
  {
    id: "caiq-lite",
    title: "CAIQ Lite pre-fill",
    description: "Questionnaire-oriented control responses for initial vendor-risk review.",
    href: resolveInAppDocHref("docs/security/CAIQ_LITE_2026.md"),
  },
  {
    id: "sig-core",
    title: "SIG Core pre-fill",
    description: "Shared Assessments SIG-style rows mapped to in-repo evidence paths.",
    href: resolveInAppDocHref("docs/security/SIG_CORE_2026.md"),
  },
  {
    id: "owner-pentest-summary",
    title: "Owner-conducted pen-test summary (2026 Q2)",
    description:
      "Owner-led penetration-style assessment — not a third-party attestation. Third-party vendor testing is planned, not yet scheduled.",
    href: resolveInAppDocHref("docs/security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md"),
  },
] as const;

export type TrustCenterRelatedHelpLink = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
};

/** Cross-links to existing `/help/{slug}` topics — no duplicate trust-page prose (TB-737). */
export const TRUST_CENTER_RELATED_HELP_LINKS: readonly TrustCenterRelatedHelpLink[] = [
  {
    id: "tenant-isolation",
    label: "Data handling and tenant isolation",
    href: "/help/data-handling",
  },
  {
    id: "subprocessors",
    label: "Subprocessors",
    href: "/help/subprocessors",
  },
  {
    id: "getting-started",
    label: "How ArchLucid works",
    href: "/help/getting-started#how-archlucid-works",
  },
  {
    id: "audit-trail",
    label: "Audit trail coverage",
    href: "/help/audit-trail",
  },
] as const;

/** `/trust` — downloads, posture tables, and diligence intake. */
export const TRUST_CENTER_PAGE_PURPOSE =
  "Full Trust Center — public evidence downloads, procurement posture, and security contact paths." as const;

/** `/security-trust` — sponsor assurance ladder; depth and ZIP downloads live on `/trust`. */
export const SECURITY_TRUST_PAGE_PURPOSE =
  "Assurance status — engagement metadata by maturity tier. For downloadable artifacts and the evidence pack, use the Trust Center." as const;
