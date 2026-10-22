import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const SIGNUP_VERIFY_CANONICAL_PATH = "/signup/verify" as const;

export const SIGNUP_VERIFY_CLAIM_DISCIPLINE =
  "Email verification continues evaluation workspace setup — not proof for procurement. Open Assurance status or Pricing when you need official materials.";

export const SIGNUP_VERIFY_SOURCES_INTRO =
  "Use these evaluation links when verification questions turn into signup restart, packaging, or first-run follow-ups.";


/** Marketing Sources — no self-href to `/signup/verify`. */
export const SIGNUP_VERIFY_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Start evaluation", href: "/signup" },
  { label: "Product FAQ", href: "/faq" },
  { label: "Pricing", href: "/pricing" },
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;
