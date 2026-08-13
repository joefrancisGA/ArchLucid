import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  ADVISORY_SCANS_CLAIM_DISCIPLINE,
  ADVISORY_SCANS_SOURCES,
  ADVISORY_SCANS_SOURCES_INTRO,
} from "@/lib/advisory-scans-evidence-copy";

export const ADVISORY_SCANS_HELP_CANONICAL_PATH = "/help/advisory-scans" as const;

export const ADVISORY_SCANS_HELP_TOPIC_LABEL = "How advisory scans work" as const;

export const ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE = ADVISORY_SCANS_CLAIM_DISCIPLINE;

export const ADVISORY_SCANS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const ADVISORY_SCANS_HELP_SOURCES_INTRO = ADVISORY_SCANS_SOURCES_INTRO;

export const ADVISORY_SCANS_HELP_SOURCES: readonly EvidenceSourceLink[] = ADVISORY_SCANS_SOURCES;
