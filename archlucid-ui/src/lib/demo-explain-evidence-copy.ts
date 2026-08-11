import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const DEMO_EXPLAIN_CANONICAL_PATH = "/demo/explain" as const;

export const DEMO_EXPLAIN_CLAIM_DISCIPLINE =
  "This page shows an example provenance graph and citations-bound explanation for a seeded demo review — it is not a signed-review diligence Sources package. Open live Reviews, Provenance, or Assurance status when you need workspace packages or assurance claims.";

export const DEMO_EXPLAIN_SOURCES_INTRO =
  "Use these follow-ups when demo explain turns into starting a real review, validating provenance, or opening buyer/demo orientation.";


/** Operator Sources — no self-href to `/demo/explain`. */
export const DEMO_EXPLAIN_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Start a review", href: "/architecture/reviews/new" },
  { label: "Validate review", href: "/internal/replay" },
  { label: "Evidence trail help", href: "/help/evidence-trail" },
  { label: "Why ArchLucid", href: "/why-archlucid" },
  { label: "Demo preview", href: "/demo/preview" },
  { label: "Assurance status", href: "/security-trust" },
] as const;
