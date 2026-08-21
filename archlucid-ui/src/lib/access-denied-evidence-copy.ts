import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ACCESS_DENIED_CANONICAL_PATH = "/403" as const;

export const ACCESS_DENIED_CLAIM_DISCIPLINE_HEADING = "What access denied is not";

export const ACCESS_DENIED_FOLLOW_UPS_TITLE = "Where to go next";

export const ACCESS_DENIED_CLAIM_DISCIPLINE =
  "Access denied explains that your signed-in account lacks a recognized ArchLucid app role for this tenant — authorization only, not a full audit export. After an administrator grants a role, open Assurance status or a finalized review when you need workspace evidence.";

export const ACCESS_DENIED_SOURCES_INTRO =
  "Use these follow-ups when access is blocked or you need evaluation orientation before a workspace role is ready.";


/** Public Sources — no self-href to /403. */
export const ACCESS_DENIED_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Sign in", href: "/auth/signin" },
  { label: "Start evaluation", href: "/signup" },
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Product FAQ", href: "/faq" },
  { label: "Privacy", href: "/privacy" },
] as const;
