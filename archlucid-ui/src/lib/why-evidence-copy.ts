import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const WHY_CANONICAL_PATH = "/why" as const;

export const WHY_CLAIM_DISCIPLINE =
  "This Why ArchLucid page compares product fit for evaluation — it is marketing differentiation orientation, not a signed-review diligence Sources package from your tenant. Open Assurance status, Trust Center, or start an evaluation when you need live workspace evidence.";

export const WHY_SOURCES_INTRO =
  "Use these evaluation links when the comparison story turns into a sample proof, signup, or assurance review.";


/** Marketing Sources — no self-href to `/why`. */
export const WHY_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "See a sample review", href: "/see-it" },
  { label: "Start evaluation", href: "/signup" },
  { label: "Get started", href: "/get-started" },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Trust Center", href: "/trust" },
] as const;
