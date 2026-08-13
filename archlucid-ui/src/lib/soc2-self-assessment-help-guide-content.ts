import { SOC2_SELF_ASSESSMENT_HELP_PATH } from "@/lib/soc2-self-assessment-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export function formatSoc2SelfAssessmentHelpReviewedCopy(lastReviewed: string): string {
  return `Last reviewed ${lastReviewed} against docs/security/SOC2_SELF_ASSESSMENT_2026.md — self-assessment mapping only, not CPA attestation.`;
}

export const SOC2_SELF_ASSESSMENT_HELP_PAGE_TITLE = "SOC 2 self-assessment";

export const SOC2_SELF_ASSESSMENT_HELP_PAGE_SUBTITLE =
  "Internal readiness mapping aligned to SOC 2 Common Criteria — not a CPA attestation report.";

export const SOC2_SELF_ASSESSMENT_HELP_OVERVIEW =
  "Use this page when a reviewer asks how ArchLucid maps to SOC 2 Trust Services Criteria today. It is an owner self-assessment and control summary for diligence orientation — open Trust Center for the pack index, and use CAIQ/SIG when questionnaires are the ask.";

export const SOC2_SELF_ASSESSMENT_HELP_CLAIM_DISCIPLINE =
  "This is a self-assessment, not a SOC 2 Type I or Type II CPA attestation. Type I planning milestones on this page are illustrative and budget-gated — not a committed report date. Do not imply a published third-party pen test from this page.";

export const SOC2_SELF_ASSESSMENT_HELP_ORIENTATION = [
  "Open Trust Center for the diligence pack path and assurance artifacts.",
  "Use CAIQ / SIG help when procurement sent questionnaire worksheets.",
  "Read the control summary below as readiness mapping, not an audit opinion.",
] as const;

export type Soc2SelfAssessmentHelpJobMatrixRow = {
  readonly label: string;
  readonly when: string;
  readonly href?: string;
};

/** Explicit job split vs CAIQ, Trust Center, and procurement (TB-1749). */
export const SOC2_SELF_ASSESSMENT_HELP_JOB_MATRIX: readonly Soc2SelfAssessmentHelpJobMatrixRow[] = [
  {
    label: "This SOC 2 self-assessment",
    when: "TSC control readiness mapping and gap register",
  },
  {
    label: "CAIQ / SIG questionnaires",
    href: inAppHelpHref("caiq-sig-response"),
    when: "Pre-filled questionnaire responses for security questionnaires",
  },
  {
    label: "Trust Center",
    href: "/trust",
    when: "Diligence pack index and downloadable assurance artifacts",
  },
  {
    label: "Procurement FAQ",
    href: inAppHelpHref("procurement"),
    when: "Commercial and assurance FAQ objections",
  },
] as const;

export const SOC2_SELF_ASSESSMENT_HELP_PRIMARY_ACTIONS = {
  openTrustCenter: {
    label: "Open Trust Center",
    href: "/trust",
  },
  openCaiqSig: {
    label: "CAIQ / SIG questionnaires",
    href: inAppHelpHref("caiq-sig-response"),
  },
  openProcurement: {
    label: "Procurement FAQ",
    href: inAppHelpHref("procurement"),
  },
} as const;

export type Soc2SelfAssessmentHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

export const SOC2_SELF_ASSESSMENT_HELP_SOURCES_INTRO =
  "Use these follow-ups when the self-assessment turns into live assurance hubs, questionnaire responses, or contract diligence.";

/** Sponsor-safe diligence Sources — no self-href to this topic. */
export const SOC2_SELF_ASSESSMENT_HELP_SOURCES: readonly Soc2SelfAssessmentHelpSourceLink[] = [
  { label: "Trust Center", href: "/trust" },
  { label: "Security and trust", href: inAppHelpHref("security-trust") },
  { label: "CAIQ / SIG questionnaires", href: inAppHelpHref("caiq-sig-response") },
  { label: "Procurement FAQ", href: inAppHelpHref("procurement") },
  { label: "DPA template", href: inAppHelpHref("dpa-template") },
  { label: "Subprocessors", href: inAppHelpHref("subprocessors") },
  {
    label: "Data handling and tenant isolation",
    href: inAppHelpHref("data-handling"),
  },
] as const;

export const SOC2_SELF_ASSESSMENT_HELP_CANONICAL_PATH = SOC2_SELF_ASSESSMENT_HELP_PATH;
