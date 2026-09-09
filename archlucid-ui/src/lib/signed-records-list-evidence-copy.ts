import {
  HUB_SECONDARY_FOLLOW_UPS_TITLES,
  hubSecondaryFollowUpsIntro,
} from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import {
  SIGNED_RECORD_CLAIM_DISCIPLINE,
  SIGNED_RECORD_SOURCES,
} from "@/lib/signed-record-evidence-copy";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

/** Workbook path for SI signed-records list hub. */
export const SIGNED_RECORDS_LIST_CANONICAL_PATH = SIGNED_RECORDS_LIST_PATH;

export const SIGNED_RECORDS_LIST_HELP_TOPIC_LABEL = "How finalized review records work" as const;

export const SIGNED_RECORDS_LIST_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.governanceFindings;

export const SIGNED_RECORDS_LIST_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "a finalized package needs findings triage, audit trail, or official assurance materials",
);

/** Reuses detail Sources — no self-href to the list hub. */
export const SIGNED_RECORDS_LIST_SOURCES: readonly EvidenceSourceLink[] = SIGNED_RECORD_SOURCES;

const SIGNED_RECORDS_LIST_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([SIGNED_RECORDS_LIST_CANONICAL_PATH]);

/** Operator orientation Sources — excludes self-href to `/governance/sealed-records` (SI). */
export const SIGNED_RECORDS_LIST_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] = SIGNED_RECORDS_LIST_SOURCES.filter(
  (source) => !SIGNED_RECORDS_LIST_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
);

/** List index claim discipline — same honesty boundary as package detail. */
export const SIGNED_RECORDS_LIST_CLAIM_DISCIPLINE = SIGNED_RECORD_CLAIM_DISCIPLINE;
