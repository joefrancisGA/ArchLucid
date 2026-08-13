import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ARCHITECTURE_SCORECARD_HELP_CANONICAL_PATH = "/help/architecture-scorecard" as const;

export const ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE = "Related evidence and sources";

export const ARCHITECTURE_SCORECARD_HELP_SOURCES_INTRO =
  "Finalize reviews so throughput tiles populate before you cite savings in sponsor conversations.";

export const ARCHITECTURE_SCORECARD_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
] as const;
