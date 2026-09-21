import type { FindingDispositionConflictDetail } from "@/lib/findings/finding-disposition-conflict";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const INHABIT_FINDING_409_CONFLICT_HELP_HREF = inAppHelpHref("inhabit-the-architecture");

/** IH-058 — conflict honesty without presence or live cursors. */
export function formatInhabitFindingDispositionConflictMessage(
  conflict: FindingDispositionConflictDetail,
): string {
  return [
    `Another operator updated this finding (${conflict.disposition} at ${conflict.occurredAtUtc}).`,
    "This is a version conflict — not live co-editing or overlap indicators.",
    "Use Keep mine or Load theirs, then amend or record a correction if needed.",
    "Draft work leases apply on the architecture draft editor; finding disposition uses CAS on the shared job.",
  ].join(" ");
}
