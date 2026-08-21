import {
  SIGNED_RECORD_CLAIM_DISCIPLINE,
  SIGNED_RECORD_SOURCES,
} from "@/lib/signed-record-evidence-copy";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

/** Workbook path for SI signed-records list hub. */
export const SIGNED_RECORDS_LIST_CANONICAL_PATH = SIGNED_RECORDS_LIST_PATH;

export const SIGNED_RECORDS_LIST_HELP_TOPIC_LABEL = "How sealed review records work" as const;

export const SIGNED_RECORDS_LIST_SOURCES_INTRO =
  "Use these follow-ups when a finalized package needs findings triage, audit trail, or official assurance materials. Open a sealed record row for package lineage.";

/** Reuses detail Sources — no self-href to the list hub. */
export const SIGNED_RECORDS_LIST_SOURCES: readonly EvidenceSourceLink[] = SIGNED_RECORD_SOURCES;

/** List index claim discipline — same honesty boundary as package detail. */
export const SIGNED_RECORDS_LIST_CLAIM_DISCIPLINE = SIGNED_RECORD_CLAIM_DISCIPLINE;
