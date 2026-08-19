import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const AUTH_BOOTSTRAP_CANONICAL_PATH = "/auth/bootstrap" as const;

export const AUTH_BOOTSTRAP_CLAIM_DISCIPLINE_HEADING = "What workspace setup is not";

export const AUTH_BOOTSTRAP_FOLLOW_UPS_TITLE = "Where to go next";

export const AUTH_BOOTSTRAP_CLAIM_DISCIPLINE =
  "Post-sign-in workspace setup chooses or creates a workspace — it is an authentication handoff, not a sealed-review diligence Sources package. After you enter a workspace, open Assurance status or a finalized review when you need live workspace evidence.";

export const AUTH_BOOTSTRAP_SOURCES_INTRO =
  "Use these follow-ups when bootstrap is blocked or you need product orientation before a workspace is ready.";


/** Public/product Sources — no self-href to `/auth/bootstrap`. */
export const AUTH_BOOTSTRAP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Sign in", href: "/auth/signin" },
  { label: "Start evaluation", href: "/signup" },
  { label: "Get started", href: "/get-started" },
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Product FAQ", href: "/faq" },
] as const;
