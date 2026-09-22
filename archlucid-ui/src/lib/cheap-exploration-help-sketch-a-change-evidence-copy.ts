import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { HELP_HUB_CANONICAL_PATH } from "@/lib/help/help-hub-evidence-copy";
import { CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PATH } from "@/lib/cheap-exploration-help-sketch-a-change-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_CANONICAL_PATH =
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PATH;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_TOPIC_LABEL = "Sketch a change" as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_CLAIM_DISCIPLINE =
  "This topic explains the architecture desk cheap envelope — it is not a sealed-review diligence Sources package and does not observe production systems. Practice-labeled sketches are not procurement proof until you explicitly execute a Record review and finalize honest sealed-record artifacts." as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_CLAIM_HEADING_ID =
  "help-sketch-a-change-practice-envelope" as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Help index", href: HELP_HUB_CANONICAL_PATH },
  { label: "Architecture desk", href: inAppHelpHref("architecture-desk") },
  { label: "Impact preview vs architecture envelope", href: inAppHelpHref("impact-preview-vs-architecture-envelope") },
  { label: "Record vs Practice on the Working desk", href: inAppHelpHref("career-vs-rehearsal") },
  { label: "Security & Trust", href: inAppHelpHref("security-trust") },
] as const;
