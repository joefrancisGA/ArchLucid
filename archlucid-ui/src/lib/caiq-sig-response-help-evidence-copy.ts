import type { EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CAIQ_SIG_RESPONSE_HELP_CANONICAL_PATH = "/help/caiq-sig-response" as const;

export const CAIQ_SIG_RESPONSE_HELP_TOPIC_LABEL = "How CAIQ and SIG responses work" as const;

/** Print / PDF export — full claim discipline (not duplicated on-screen). */
export const CAIQ_SIG_RESPONSE_HELP_CLAIM_DISCIPLINE =
  "This CAIQ / SIG questionnaire guide maps pre-filled responses to in-repo evidence for procurement reviewers — it is help orientation and self-attested questionnaire fill, not a CPA SOC 2 attestation, a published third-party pen-test report, or a full audit export from your tenant. Open SOC 2 self-assessment, Trust Center, or Procurement FAQ when you need related assurance surfaces.";

export const CAIQ_SIG_RESPONSE_HELP_LEAD =
  "Pre-filled CAIQ Lite themes and SIG Core control families mapped to in-repo evidence for procurement reviewers drafting security questionnaires.";

export const CAIQ_SIG_RESPONSE_HELP_CLAIM_HEADING = "Self-attested questionnaire fill" as const;

export const CAIQ_SIG_RESPONSE_HELP_CLAIM_SCOPE =
  "Self-attested questionnaire fill for diligence orientation — transpose rows into your buyer workbook cell-for-cell.";

export const CAIQ_SIG_RESPONSE_HELP_CLAIM_NOT_THIS = [
  "Not a CPA SOC 2 attestation",
  "Not a published third-party pen-test report",
  "Not a full audit export from your tenant",
] as const;

export const CAIQ_SIG_RESPONSE_HELP_SOURCES_INTRO =
  "Use these follow-ups when CAIQ/SIG vocabulary turns into SOC 2 mapping, Trust Center pack, DPA, subprocessors, or procurement FAQ.";

export const CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTION = {
  label: "Open Trust Center",
  href: "/trust",
  testId: "help-caiq-sig-response-primary-action",
} as const;

export type CaiqSigResponseHelpSourceLink = EvidenceSourceLinkWithWhen;

/** Operator Sources — no self-href to `/help/caiq-sig-response`. */
export const CAIQ_SIG_RESPONSE_HELP_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  {
    label: "SOC 2 self-assessment",
    href: inAppHelpHref("soc2-self-assessment"),
    when: "TSC control readiness mapping when SOC 2 is the ask",
  },
  {
    label: "Trust Center",
    href: "/trust",
    when: "Diligence pack index and downloadable assurance artifacts",
  },
  {
    label: "Assurance status",
    href: "/assurance-status",
    when: "Live assurance posture, milestones, and program status",
  },
  {
    label: "Procurement FAQ",
    href: inAppHelpHref("procurement"),
    when: "Commercial and assurance FAQ objections",
  },
  {
    label: "DPA template",
    href: inAppHelpHref("dpa-template"),
    when: "Contractual data-processing terms before signature",
  },
  {
    label: "Subprocessors",
    href: inAppHelpHref("subprocessors"),
    when: "Hosted-service processor register with DPA schedule",
  },
] as const;
