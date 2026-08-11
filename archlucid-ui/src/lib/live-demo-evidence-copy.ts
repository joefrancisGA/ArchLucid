import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const LIVE_DEMO_CANONICAL_PATH = "/live-demo" as const;

export const LIVE_DEMO_CLAIM_DISCIPLINE =
  "This guided sample walkthrough is a read-only tour of a fabricated sample architecture review — it is marketing evaluation orientation, not a live tenant session or a signed-review diligence Sources package from your workspace. Open Assurance status or start an evaluation when you need live workspace evidence.";

export const LIVE_DEMO_SOURCES_INTRO =
  "Use these evaluation links when the sample walkthrough turns into signup, assurance, or a deeper product tour.";


/** Marketing Sources — no self-href to `/live-demo`. */
export const LIVE_DEMO_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Start evaluation", href: "/signup" },
  { label: "Get started", href: "/get-started" },
  { label: "Demo preview", href: "/demo/preview" },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Product FAQ", href: "/faq" },
] as const;
