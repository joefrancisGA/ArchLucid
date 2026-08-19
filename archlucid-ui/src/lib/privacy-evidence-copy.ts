import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const PRIVACY_CANONICAL_PATH = "/privacy" as const;

export const PRIVACY_CLAIM_DISCIPLINE =
  "This Privacy Policy is a public legal notice for website visitors and product users — it is not a sealed-review diligence Sources package. Open Assurance status or Trust Center when you need evaluation assurance materials.";

export const PRIVACY_SOURCES_INTRO =
  "Use these evaluation links when privacy questions turn into assurance, data-handling, or trust follow-ups.";


/** Marketing Sources — no self-href to /privacy. */
export const PRIVACY_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Trust Center", href: "/trust" },
  { label: "Data handling", href: inAppHelpHref("data-handling") },
  { label: "FAQ", href: "/faq" },
  { label: "Start evaluation", href: "/signup" },
] as const;
