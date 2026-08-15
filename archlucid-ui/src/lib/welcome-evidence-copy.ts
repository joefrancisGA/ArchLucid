import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const WELCOME_CANONICAL_PATH = "/welcome" as const;

export const WELCOME_CLAIM_DISCIPLINE =
  "This welcome page is marketing product orientation for buyers evaluating ArchLucid — it is not a sealed-review diligence Sources package from your tenant. Open Assurance status, Trust Center, or start an evaluation when you need live workspace evidence.";

export const WELCOME_SOURCES_INTRO =
  "Use these evaluation links when the landing story turns into a sample proof, signup, or assurance review.";


/** Marketing Sources — no self-href to `/welcome`. */
export const WELCOME_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "See a sample review", href: "/see-it" },
  { label: "Start evaluation", href: "/signup" },
  { label: "Get started", href: "/get-started" },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Trust Center", href: "/trust" },
] as const;
