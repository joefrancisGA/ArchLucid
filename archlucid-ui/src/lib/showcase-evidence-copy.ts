import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const SHOWCASE_CANONICAL_PATH_PREFIX = "/showcase/" as const;

export const SHOWCASE_CLAIM_DISCIPLINE =
  "This showcase presents an illustrative architecture sample for evaluation — not live workspace evidence. Open Assurance status or start an evaluation when you need real records from your tenant.";

export const SHOWCASE_SOURCES_INTRO =
  "Use these evaluation links when the sample review turns into signup, assurance, or a live product tour.";


/** Marketing Sources — no self-href under `/showcase/`. */
export const SHOWCASE_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Start evaluation", href: "/signup" },
  { label: "Get started", href: "/get-started" },
  { label: "See it in 30 seconds", href: "/see-it" },
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Product FAQ", href: "/faq" },
] as const;
