import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const TRY_CANONICAL_PATH = "/try" as const;

export const TRY_CLAIM_DISCIPLINE =
  "This try page launches an illustrative sample review for evaluation — it is marketing frictionless trial orientation, not a sealed-review diligence Sources package from your tenant. Open Assurance status or start an evaluation when you need live workspace evidence.";

export const TRY_SOURCES_INTRO =
  "Use these evaluation links when the sample inspection turns into signup, assurance, or a guided first-run path.";


/** Marketing Sources — no self-href to `/try`. */
export const TRY_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Start evaluation", href: "/signup" },
  { label: "Get started", href: "/get-started" },
  { label: "Demo preview", href: "/demo/preview" },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Product FAQ", href: "/faq" },
] as const;
