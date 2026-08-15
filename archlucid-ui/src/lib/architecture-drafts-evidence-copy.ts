import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import {
  ARCHITECTURES_NEW_PATH,
  REVIEWS_NEW_PATH,
} from "@/lib/architecture/architecture-routes";

export const ARCHITECTURE_DRAFTS_CANONICAL_PATH = "/architecture/architectures";

export const ARCHITECTURE_DRAFTS_HELP_TOPIC_LABEL = "How architecture drafts work";

export const ARCHITECTURE_DRAFTS_CLAIM_DISCIPLINE =
  "Architecture drafts let you save and resume system briefs before filing evidence for review — they are not a sealed-review diligence Sources package.";

export const ARCHITECTURE_DRAFTS_SOURCES_INTRO =
  "Use these follow-ups when you need to create a new architecture, start review intake, or get oriented.";

/** Operator Sources — no self-href to `/architecture/architectures`. */
export const ARCHITECTURE_DRAFTS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: CREATE_ARCHITECTURE_LABEL, href: ARCHITECTURES_NEW_PATH },
  { label: "Start a review", href: REVIEWS_NEW_PATH },
  { label: "Your first architecture review", href: "/help/first-architecture-review" },
  { label: "Getting started", href: "/help/getting-started" },
] as const;
