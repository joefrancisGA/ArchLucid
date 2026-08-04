import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const HOW_ARCHLUCID_WORKS_CANONICAL_PATH = "/help/how-it-works" as const;

export const HOW_ARCHLUCID_WORKS_CLAIM_DISCIPLINE =
  "This guide orients evaluators on how evidence becomes findings, decisions, and exports — it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Security & trust or Getting started before treating workflow copy as assurance evidence.";

export const HOW_ARCHLUCID_WORKS_SOURCES_INTRO =
  "Use these follow-ups when workflow questions turn into first-review practice, assurance cites, or getting-started paths.";

export type HowArchLucidWorksSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/how-it-works`. */
export const HOW_ARCHLUCID_WORKS_SOURCES: readonly HowArchLucidWorksSourceLink[] = [
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "Security & trust", href: "/security-trust" },
  { label: "Data handling & isolation", href: inAppHelpHref("data-handling-tenant-isolation") },
  { label: "First architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Product FAQ", href: "/faq" },
] as const;
