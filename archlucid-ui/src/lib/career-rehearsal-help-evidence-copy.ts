import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CAREER_REHEARSAL_HELP_CANONICAL_PATH = "/help/career-vs-rehearsal" as const;

export const CAREER_REHEARSAL_HELP_TOPIC_LABEL = "Career vs Rehearsal on the Working desk" as const;

export const CAREER_REHEARSAL_HELP_CLAIM_DISCIPLINE =
  "This topic explains the Working desk doors — it is not a sealed-review diligence Sources package. Open a finalized review or Security & Trust before treating rehearsal copy as procurement evidence.";

export const CAREER_REHEARSAL_HELP_CLAIM_HEADING_ID = "career-rehearsal-claim-discipline" as const;

export const CAREER_REHEARSAL_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "How to get started", href: inAppHelpHref("getting-started") },
  { label: "Security & Trust", href: "/assurance-status" },
] as const;
