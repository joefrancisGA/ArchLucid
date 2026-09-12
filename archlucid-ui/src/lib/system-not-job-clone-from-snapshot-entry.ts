import {
  labelForWorkingCareerRehearsalDoor,
  type WorkingCareerRehearsalDoorId,
} from "@/lib/governance/working-career-rehearsal-door";
import { BILLING_ARCHITECTURE_PACKAGE_OVERAGE_UNIT_LABEL } from "@/lib/vocabulary/billing-meter-vocabulary";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DOC_ANCHOR =
  "docs/architecture/adrs/0092-working-cheap-what-if-envelope.md" as const;

/** SN-008 desk CTA after spawn — architecture sketch path, not editable snapshot (ADR 0092). */
export const SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DESK_CTA_LABEL = "New version (clone)" as const;

export const SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_CONFIRM_TITLE =
  "Start new version from snapshot?" as const;

export const SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_CONFIRM_ACTION = "Start new version" as const;

export const SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_CONFIRM_CANCEL_ACTION = "Cancel" as const;

/** Command palette + work-action bridge discovery for spawn-locked clone CTAs. */
export const SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID =
  "architecture-spawn-lock-clone-snapshot" as const;

export type SystemNotJobCloneFromSnapshotConfirmCopy = {
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
};

/** Full-run cost sentence when branch quota is unavailable (SN-009 adds cap chrome). */
export function resolveSystemNotJobCloneFromSnapshotFullRunCostSentence(): string {
  return `Submitting a full Career review later counts as one billable ${BILLING_ARCHITECTURE_PACKAGE_OVERAGE_UNIT_LABEL} (full pipeline run).`;
}

/**
 * SN-008 confirm copy: Rehearsal-stamped architecture sketch (ADR 0092), inherits CG door rules,
 * honest about billable full pipeline if the operator later executes Career.
 */
export function resolveSystemNotJobCloneFromSnapshotConfirmCopy(args: {
  readonly effectiveDoor: WorkingCareerRehearsalDoorId;
  readonly quotaSummary?: string | null;
}): SystemNotJobCloneFromSnapshotConfirmCopy {
  const doorLabel = labelForWorkingCareerRehearsalDoor(args.effectiveDoor);
  const quotaSummary = args.quotaSummary?.trim() ?? "";
  const costLine =
    quotaSummary.length > 0
      ? quotaSummary
      : resolveSystemNotJobCloneFromSnapshotFullRunCostSentence();

  const description = [
    "Creates a new editable draft under this architecture — the legal new version after spawn lock. The parent snapshot and linked review stay sealed.",
    `The clone stays ${doorLabel}-stamped as an architecture sketch (ADR 0092) until you explicitly execute a Career review. CG door rules apply to the new draft.`,
    costLine,
  ].join(" ");

  return {
    title: SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_CONFIRM_TITLE,
    description,
    confirmLabel: SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_CONFIRM_ACTION,
    cancelLabel: SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_CONFIRM_CANCEL_ACTION,
  };
}
