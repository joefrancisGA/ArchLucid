import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const GLOSSARY_HELP_CANONICAL_PATH = "/help/glossary" as const;

export const GLOSSARY_HELP_CLAIM_DISCIPLINE =
  "This glossary defines product terms for operators and buyers — it is orientation vocabulary, not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Getting started, Assurance status, or Audit when you need live workflow or assurance trails.";

export const GLOSSARY_HELP_SOURCES_INTRO =
  "Use these follow-ups when a glossary term turns into product orientation, assurance, or first-run setup.";

export type GlossaryHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/glossary`. */
export const GLOSSARY_HELP_SOURCES: readonly GlossaryHelpSourceLink[] = [
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Audit", href: "/governance/audit" },
  { label: "Pilot guide", href: inAppHelpHref("pilot-guide") },
] as const;
