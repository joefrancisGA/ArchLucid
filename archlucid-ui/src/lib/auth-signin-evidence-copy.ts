import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const AUTH_SIGNIN_CLAIM_DISCIPLINE =
  "Sign-in chooses how you authenticate into ArchLucid — it is an authentication gate, not a signed-review diligence Sources package. After you enter a workspace, open Assurance status or a finalized review when you need live workspace evidence.";

export const AUTH_SIGNIN_SOURCES_INTRO =
  "Use these follow-ups when sign-in is blocked or you need product orientation before a workspace is ready.";


/** Public Sources — no self-href to /auth/signin. */
export const AUTH_SIGNIN_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Start evaluation", href: "/signup" },
  { label: "Get started", href: "/get-started" },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Product FAQ", href: "/faq" },
  { label: "Privacy", href: "/privacy" },
] as const;
