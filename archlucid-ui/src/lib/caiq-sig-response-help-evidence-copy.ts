import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CAIQ_SIG_RESPONSE_HELP_CANONICAL_PATH = "/help/caiq-sig-response" as const;

export const CAIQ_SIG_RESPONSE_HELP_CLAIM_DISCIPLINE =
  "This CAIQ / SIG questionnaire guide maps pre-filled responses to in-repo evidence for procurement reviewers — it is help orientation and self-attested questionnaire fill, not a CPA SOC 2 attestation, a published third-party pen-test report, or a signed-review diligence Sources package from your tenant. Open SOC 2 self-assessment, Trust Center, or Procurement FAQ when you need related assurance surfaces.";

export const CAIQ_SIG_RESPONSE_HELP_SOURCES_INTRO =
  "Use these follow-ups when CAIQ/SIG vocabulary turns into assurance hubs, DPA, subprocessors, or procurement FAQ.";

export type CaiqSigResponseHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/caiq-sig-response`. */
export const CAIQ_SIG_RESPONSE_HELP_SOURCES: readonly CaiqSigResponseHelpSourceLink[] = [
  { label: "SOC 2 self-assessment", href: inAppHelpHref("soc2-self-assessment") },
  { label: "Trust Center", href: "/trust" },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Procurement FAQ", href: inAppHelpHref("procurement") },
  { label: "Subprocessors", href: inAppHelpHref("subprocessors") },
] as const;
