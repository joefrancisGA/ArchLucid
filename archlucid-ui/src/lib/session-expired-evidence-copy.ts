import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const SESSION_EXPIRED_CANONICAL_PATH = "/auth/session-expired" as const;

export const SESSION_EXPIRED_FOLLOW_UPS_TITLE = "Where to go next";

export const SESSION_EXPIRED_SOURCES_INTRO =
  "Use these public follow-ups when you need product orientation before signing in again (authenticated workspace routes stay unavailable until you sign in).";

/** Public Sources — no self-href to `/auth/session-expired`; avoid auth-gated artifact links. */
export const SESSION_EXPIRED_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Get started", href: "/get-started" },
  { label: "See a sample review", href: "/see-it" },
  { label: "Assurance status", href: "/assurance-status" },
] as const;
