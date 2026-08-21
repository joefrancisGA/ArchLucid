import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const DEMO_EXPLAIN_CANONICAL_PATH = "/demo/explain" as const;

export const DEMO_EXPLAIN_HELP_TOPIC_LABEL = "Demo explain" as const;

export const DEMO_EXPLAIN_CLAIM_DISCIPLINE =
  "This page shows an example evidence trail and citations-bound explanation for a seeded demo review — not a full audit export. Open live Reviews, Provenance, or Assurance status for real packages.";

export const DEMO_EXPLAIN_SOURCES_INTRO =
  "Use these follow-ups when demo explain turns into starting a real review, validating provenance, or opening buyer/demo orientation.";


/** Operator Sources — no self-href to `/demo/explain`. */
export const DEMO_EXPLAIN_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Start a review", href: "/architecture/reviews/new" },
  { label: "Validate review", href: "/internal/validate-route" },
  { label: "Evidence trail help", href: "/help/evidence-trail" },
  { label: "Why ArchLucid", href: "/why-archlucid" },
  { label: "See it in 30 seconds", href: "/see-it" },
  { label: "Assurance status", href: "/assurance-status" },
] as const;
