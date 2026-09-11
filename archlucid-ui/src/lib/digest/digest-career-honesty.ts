import {
  resolveRunStatusBadgeWorkingCareerHonestyCell,
  RUN_STATUS_BADGE_CAREER_BLOCKED_LABEL,
  RUN_STATUS_BADGE_REHEARSAL_INCOMPLETE_LABEL,
  RUN_STATUS_BADGE_REHEARSAL_PRACTICE_LABEL,
  type RunStatusBadgeWorkingCareerHonestyInput,
} from "@/lib/runs/run-status-badge-career-honesty";

/** CG-037 — digest row labels when Working stamp is not Career-complete. */
export const DIGEST_REHEARSAL_SUBJECT_PREFIX = "[Rehearsal] ";

export const DIGEST_REHEARSAL_BODY_DISCLAIMER =
  "This digest includes rehearsal or Simulator runs — not production customer evidence. Treat highlighted rows by their rehearsal labels.";

export type DigestCareerHonestyPresentation = {
  readonly rowLabel: string;
};

export function resolveDigestRowLabel(
  input: RunStatusBadgeWorkingCareerHonestyInput & {
    readonly isSample?: boolean | null;
  },
): DigestCareerHonestyPresentation | null {
  if (input.isSample === true) {
    return null;
  }

  const cellId = resolveRunStatusBadgeWorkingCareerHonestyCell(input);

  if (cellId === null || cellId === "career-real") {
    return null;
  }

  if (cellId === "career-simulator-blocked") {
    return { rowLabel: RUN_STATUS_BADGE_CAREER_BLOCKED_LABEL };
  }

  if (cellId === "rehearsal-simulator") {
    return { rowLabel: RUN_STATUS_BADGE_REHEARSAL_INCOMPLETE_LABEL };
  }

  return { rowLabel: RUN_STATUS_BADGE_REHEARSAL_PRACTICE_LABEL };
}

export function resolveDigestSubjectPrefix(input: {
  readonly committedRunRequiresHonesty: readonly boolean[];
}): string {
  if (input.committedRunRequiresHonesty.length === 0) {
    return "";
  }

  if (input.committedRunRequiresHonesty.every((requiresHonesty) => requiresHonesty)) {
    return DIGEST_REHEARSAL_SUBJECT_PREFIX;
  }

  return "";
}

export function resolveDigestBodyDisclaimer(input: {
  readonly committedRunRequiresHonesty: readonly boolean[];
}): string | null {
  if (input.committedRunRequiresHonesty.some((requiresHonesty) => requiresHonesty)) {
    return DIGEST_REHEARSAL_BODY_DISCLAIMER;
  }

  return null;
}
