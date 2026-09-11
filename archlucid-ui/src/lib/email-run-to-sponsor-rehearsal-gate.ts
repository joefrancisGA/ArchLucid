import {
  SIMULATOR_REHEARSAL_HEADER_BODY,
  SIMULATOR_REHEARSAL_HEADER_TITLE,
  isRehearsalStructuralExecutionMode,
} from "@/lib/governance/simulator-career-honesty";
import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";

/** CG-029 — forced prefix so mail clients cannot open an unlabeled Career subject from Simulator. */
export const EMAIL_RUN_TO_SPONSOR_REHEARSAL_SUBJECT_PREFIX = "[Rehearsal] ";

export const EMAIL_RUN_TO_SPONSOR_REHEARSAL_ACK_LABEL =
  "I understand this sponsor email is rehearsal practice — not production customer evidence.";

export type EmailRunToSponsorRehearsalGateInput = {
  readonly workingDesk?: boolean;
  readonly curatedSampleRun?: boolean;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly effectiveWorkingCareerRehearsalDoor?: WorkingCareerRehearsalDoorId | null;
};

export type EmailRunToSponsorRehearsalGate = {
  readonly requiresRehearsalEmailHonestyAck: boolean;
  readonly rehearsalSubjectPrefix: string;
};

export function resolveEmailRunToSponsorRehearsalGate(
  input: EmailRunToSponsorRehearsalGateInput,
): EmailRunToSponsorRehearsalGate {
  const requiresRehearsalEmailHonestyAck =
    input.workingDesk === true
    && input.curatedSampleRun !== true
    && isRehearsalStructuralExecutionMode(input.structuralExecutionMode ?? null)
    && input.effectiveWorkingCareerRehearsalDoor === "rehearsal";

  return {
    requiresRehearsalEmailHonestyAck,
    rehearsalSubjectPrefix: requiresRehearsalEmailHonestyAck
      ? EMAIL_RUN_TO_SPONSOR_REHEARSAL_SUBJECT_PREFIX
      : "",
  };
}

export function resolveEmailRunToSponsorSendBlocked(input: {
  readonly blockSponsorPdf: boolean;
  readonly requiresRehearsalEmailHonestyAck: boolean;
  readonly rehearsalEmailHonestyAcknowledged: boolean;
}): boolean {
  if (input.blockSponsorPdf) {
    return true;
  }

  if (input.requiresRehearsalEmailHonestyAck && !input.rehearsalEmailHonestyAcknowledged) {
    return true;
  }

  return false;
}

export function buildEmailRunToSponsorMailtoHref(input: {
  readonly runId: string;
  readonly rehearsalSubjectPrefix: string;
  readonly requiresRehearsalBodyDisclaimer: boolean;
}): string {
  const baseSubject = `ArchLucid pilot results — architecture review (${input.runId})`;
  const subject = `${input.rehearsalSubjectPrefix}${baseSubject}`;
  const rehearsalLines = input.requiresRehearsalBodyDisclaimer
    ? `${SIMULATOR_REHEARSAL_HEADER_TITLE}\n${SIMULATOR_REHEARSAL_HEADER_BODY}\n\n`
    : "";
  const body = `${rehearsalLines}Hello,\n\nAttached is our ArchLucid architecture review package for this pilot run. Please treat rehearsal-labeled output as practice only unless we confirm Real execution separately.\n\nThank you.`;

  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
