import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export {
  ARCHITECTURE_SCORECARD_CLAIM_DISCIPLINE,
  ARCHITECTURE_SCORECARD_SOURCES,
  ARCHITECTURE_SCORECARD_SOURCES_INTRO,
} from "@/lib/architecture/architecture-scorecard-evidence-copy";

export type ArchitectureScorecardSourceLink = {
  readonly label: string;
  readonly href: string;
};

export const ARCHITECTURE_SCORECARD_CANONICAL_PATH = ARCHITECTURE_SCORECARD_PATH;

export const ARCHITECTURE_SCORECARD_PRIMARY_CONTENT_ID = "architecture-scorecard-primary-content" as const;

export const ARCHITECTURE_SCORECARD_SKIP_LINK_LABEL = "Skip to architecture scorecard" as const;

export const ARCHITECTURE_SCORECARD_HELP_TOPIC_LABEL = "How architecture scorecards work";

export const ARCHITECTURE_SCORECARD_DIRECTIONAL_ROI_HELPER =
  "This estimate is directional. It is intended for pilot value discussions, not financial reporting.";

export const ARCHITECTURE_SCORECARD_HELP_HREF = inAppHelpHref("architecture-scorecard");
