import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const AUTH_CALLBACK_CANONICAL_PATH = "/auth/callback" as const;

export const AUTH_CALLBACK_CLAIM_DISCIPLINE_HEADING = "What sign-in completion is not";

export const AUTH_CALLBACK_FOLLOW_UPS_TITLE = "Where to go next";

export const AUTH_CALLBACK_CLAIM_DISCIPLINE =
  "The OAuth callback completes sign-in — authentication only, not a full audit export. After you reach a workspace, open Assurance status or a finalized review when you need live evidence.";

export const AUTH_CALLBACK_SOURCES_INTRO =
  "Use these follow-ups when the callback fails or you need evaluation orientation before a workspace is ready.";


/** Public Sources — no self-href to /auth/callback. */
export const AUTH_CALLBACK_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Sign in", href: "/auth/signin" },
  { label: "Start evaluation", href: "/signup" },
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Product FAQ", href: "/faq" },
  { label: "Authentication help", href: "/help/authentication-sign-in" },
] as const;
