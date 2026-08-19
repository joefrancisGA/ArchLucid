import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const AUTH_INVITE_CANONICAL_PATH = "/auth/invite" as const;

export const AUTH_INVITE_CLAIM_DISCIPLINE_HEADING = "What invitation accept is not";

export const AUTH_INVITE_FOLLOW_UPS_TITLE = "Where to go next";

export const AUTH_INVITE_CLAIM_DISCIPLINE =
  "This invitation accept page validates a workspace invite before sign-in — it is an authentication handoff, not a sealed-review diligence Sources package. After you sign in and join, open Assurance status or a finalized review when you need live workspace evidence.";

export const AUTH_INVITE_SOURCES_INTRO =
  "Use these follow-ups when the invitation is invalid or you need product orientation before signing in.";


/** Public/product Sources - no self-href to `/auth/invite`. */
export const AUTH_INVITE_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Sign in", href: "/auth/signin" },
  { label: "Start evaluation", href: "/signup" },
  { label: "Get started", href: "/get-started" },
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Product FAQ", href: "/faq" },
] as const;
