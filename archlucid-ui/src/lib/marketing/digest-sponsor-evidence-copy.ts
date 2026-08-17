import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const DIGEST_SPONSOR_CANONICAL_PATH = "/digest/sponsor" as const;

export const DIGEST_SPONSOR_CLAIM_DISCIPLINE =
  "This sponsor digest deep link is a read-only email snapshot for evaluation — it is not a sealed-review diligence Sources package from your tenant. Sign in, open Assurance status, or the Trust Center when you need live workspace evidence.";

export const DIGEST_SPONSOR_SOURCES_INTRO =
  "Use these follow-ups when the digest snapshot leads into sign-in, assurance, or first-review planning.";

/** Marketing Sources — no self-href to tokenized /digest/sponsor URLs. */
export const DIGEST_SPONSOR_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Trust Center", href: "/trust" },
  { label: "Get started", href: "/get-started" },
  { label: "Sign in", href: "/auth/signin" },
  { label: "Digests help", href: inAppHelpHref("digests") },
  { label: "Sponsor dashboard help", href: inAppHelpHref("sponsor-dashboard") },
] as const;
