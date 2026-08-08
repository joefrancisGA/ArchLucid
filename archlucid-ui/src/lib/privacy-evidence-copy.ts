import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const PRIVACY_CANONICAL_PATH = "/privacy" as const;

export const PRIVACY_CLAIM_DISCIPLINE =
  "This Privacy Policy is a public legal notice for website visitors and product users — it is not a signed-review diligence Sources package. Open Assurance status or Trust Center when you need evaluation assurance materials.";

export const PRIVACY_SOURCES_INTRO =
  "Use these evaluation links when privacy questions turn into assurance, data-handling, or trust follow-ups.";

export type PrivacySourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Marketing Sources — no self-href to /privacy. */
export const PRIVACY_SOURCES: readonly PrivacySourceLink[] = [
  { label: "Assurance status", href: "/security-trust" },
  { label: "Trust Center", href: "/trust" },
  { label: "Data handling", href: inAppHelpHref("data-handling") },
  { label: "FAQ", href: "/faq" },
  { label: "Start evaluation", href: "/signup" },
] as const;
