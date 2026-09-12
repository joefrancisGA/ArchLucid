import { compareRunBuyerDisplayLabel } from "@/lib/compare-run-display-label";
import { isRunCommittedForBaseline } from "@/lib/compare-baseline-run";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import {
  labelForWorkingCareerRehearsalDoor,
  type WorkingCareerRehearsalDoorId,
} from "@/lib/governance/working-career-rehearsal-door";
import { resolveHonestyWorkingCareerRehearsalDoor } from "@/lib/governance/working-career-rehearsal-door-stamp";
import { runSummaryDisplayLabel } from "@/lib/runs/run-summary-display-label";
import type { RunSummary } from "@/types/authority";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_COMPARE_LABELED_ENVELOPE_RUNS_DOC_ANCHOR =
  "docs/architecture/adrs/0092-working-cheap-what-if-envelope.md" as const;

export const SYSTEM_NOT_JOB_COMPARE_LABELED_ENVELOPE_RUNS_OWNER = "SN-014" as const;

/** Compare pickers always require committed golden manifests (R12), including rehearsal-stamped envelopes. */
export const COMPARE_RUN_PICKERS_REQUIRE_COMMITTED_MANIFESTS = true;

export const COMPARE_RUN_PICKER_STAMP_TEST_IDS = {
  footnotePrefix: "compare-run-picker-stamp",
} as const;

/** Compare picker rows must be sealed runs — rehearsal-stamped ADR 0092 envelopes qualify when committed. */
export function isRunEligibleForComparePicker(run: RunSummary): boolean {
  return isRunCommittedForBaseline(run);
}

/** CG-057 / SN-014 — Mode/door stamp for a committed compare row. */
export function resolveCompareRunDoorStampLabel(run: RunSummary): string {
  const door: WorkingCareerRehearsalDoorId = resolveHonestyWorkingCareerRehearsalDoor({
    stampedDoor: run.workingCareerRehearsalDoor,
  });

  return labelForWorkingCareerRehearsalDoor(door);
}

/** Dropdown secondary line: door stamp plus technical run id (Working compare pickers). */
export function resolveCompareRunPickerDropdownSecondaryLine(run: RunSummary): string {
  const stamp = resolveCompareRunDoorStampLabel(run);
  const runId = run.runId.trim();

  return `${stamp} · ${runId}`;
}

function resolveComparePickerTitleFootnote(runId: string, picked: RunSummary | null): string | null {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const demoLabel = compareRunBuyerDisplayLabel(trimmed);

  if (demoLabel !== null) {
    return demoLabel;
  }

  if (picked === null) {
    return null;
  }

  const pickedId = picked.runId.trim();

  if (canonicalizeDemoRunId(pickedId).toLowerCase() !== canonicalizeDemoRunId(trimmed).toLowerCase()) {
    return null;
  }

  const label = runSummaryDisplayLabel(picked);

  if (label.toLowerCase() === trimmed.toLowerCase()) {
    return null;
  }

  return label;
}

/**
 * SN-014 picker footnote — review title when known, always prefixed with execute door stamp (CG-057).
 */
export function resolveComparePickerFootnote(runId: string, picked: RunSummary | null): string | null {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (picked !== null && isRunEligibleForComparePicker(picked)) {
    const stamp = resolveCompareRunDoorStampLabel(picked);
    const title = resolveComparePickerTitleFootnote(trimmed, picked);

    if (title !== null) {
      return `${stamp} · ${title}`;
    }

    return stamp;
  }

  const demoLabel = compareRunBuyerDisplayLabel(trimmed);

  if (demoLabel !== null) {
    return demoLabel;
  }

  return resolveComparePickerTitleFootnote(trimmed, picked);
}

/** Compare API accepts run ids only — not draft workspace segments or draft-request ids. */
export function isHonestCompareApiRunId(runId: string): boolean {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return false;
  }

  if (trimmed === "new") {
    return false;
  }

  if (trimmed.includes("/")) {
    return false;
  }

  return true;
}
