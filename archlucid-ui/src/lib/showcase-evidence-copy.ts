import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const SHOWCASE_CANONICAL_PATH_PREFIX = "/showcase/" as const;

export const SHOWCASE_CLAIM_DISCIPLINE =
  "This showcase presents an illustrative finalized architecture sample for evaluation — it is not a sealed-review diligence Sources package from your tenant. Open Assurance status or start an evaluation when you need live workspace evidence.";

export const SHOWCASE_SOURCES_INTRO =
  "Use these evaluation links when the sample review turns into signup, assurance, or a live product tour.";


/** Marketing Sources — no self-href under `/showcase/`. */
export const SHOWCASE_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Start evaluation", href: "/signup" },
  { label: "Get started", href: "/get-started" },
  { label: "Demo preview", href: "/demo/preview" },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Product FAQ", href: "/faq" },
] as const;
