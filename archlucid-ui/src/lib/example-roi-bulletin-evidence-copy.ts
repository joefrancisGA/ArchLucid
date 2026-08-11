import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const EXAMPLE_ROI_BULLETIN_CANONICAL_PATH = "/example-roi-bulletin" as const;

export const EXAMPLE_ROI_BULLETIN_CLAIM_DISCIPLINE =
  "This page shows a synthetic aggregate ROI bulletin Markdown shape for evaluation - it is marketing orientation, not a signed publication, or live tenant ROI. Real aggregate numbers require Admin preview after N >= 5 qualifying tenants.";

export const EXAMPLE_ROI_BULLETIN_SOURCES_INTRO =
  "Use these evaluation links when the synthetic bulletin shape turns into methodology help, sponsor ROI, assurance, or signup.";


/** Marketing Sources - no self-href to `/example-roi-bulletin`. */
export const EXAMPLE_ROI_BULLETIN_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Pilot ROI model (help)", href: "/help/pilot-roi-model" },
  { label: "Executive summary", href: "/insights/executive-summary" },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Start evaluation", href: "/signup" },
  { label: "Product FAQ", href: "/faq" },
] as const;
