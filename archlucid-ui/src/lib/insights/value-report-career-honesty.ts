import {
  resolveRunStatusBadgeWorkingCareerHonestyCell,
  type RunStatusBadgeWorkingCareerHonestyCellId,
  type RunStatusBadgeWorkingCareerHonestyInput,
} from "@/lib/runs/run-status-badge-career-honesty";
import {
  StructuralExecutionModeWire,
  type StructuralExecutionModeInput,
} from "@/lib/structural-execution-mode";
import {
  DEFAULT_WORKING_CAREER_REHEARSAL_DOOR,
  type WorkingCareerRehearsalDoorId,
} from "@/lib/governance/working-career-rehearsal-door";

/** CG-090 — value-report route honesty; complements CG-035 tile strip. */
export const VALUE_REPORT_MEASURED_SAVINGS_DISCLAIMER =
  "Directional figures are not measured procurement savings — no live spend validation (G-REAL-06 stays owner-tracked).";

export const VALUE_REPORT_SAMPLE_BANNER_SUFFIX = ` ${VALUE_REPORT_MEASURED_SAVINGS_DISCLAIMER}`;

export const VALUE_REPORT_PERIOD_MIX_TITLE = "Reporting period includes rehearsal reviews";

export const VALUE_REPORT_PERIOD_MIX_BODY =
  "This sponsor report window aggregates finalized reviews that may include Simulator or Rehearsal door runs. Outcomes stay visible for practice — do not cite period totals as measured Career ROI.";

export const VALUE_REPORT_SCOPED_CAREER_BLOCKED_TITLE =
  "Career blocked — sponsor report is not career proof";

export const VALUE_REPORT_SCOPED_CAREER_BLOCKED_BODY =
  "This review ran on Simulator or Fallback while the Career door was selected. Metrics stay visible for rehearsal — do not paste them into procurement packets as measured savings.";

export const VALUE_REPORT_SCOPED_REHEARSAL_INCOMPLETE_TITLE =
  "Rehearsal incomplete — sponsor report is rehearsal only";

export const VALUE_REPORT_SCOPED_REHEARSAL_INCOMPLETE_BODY =
  "This review ran on the Rehearsal door with Simulator or Fallback structural execute. Figures stay visible for practice — they are not career-complete sealed-record proof.";

export const VALUE_REPORT_SCOPED_PRACTICE_TITLE = "Practice — sponsor report is not career proof";

export const VALUE_REPORT_SCOPED_PRACTICE_BODY =
  "This review ran as Rehearsal door practice on Real structural execute. Metrics stay visible for rehearsal — they are not sponsor-ready career evidence.";

export type ValueReportCareerHonestyKind = "scoped" | "period-mix";

export type ValueReportCareerHonestyPresentation = {
  readonly kind: ValueReportCareerHonestyKind;
  readonly cellId?: RunStatusBadgeWorkingCareerHonestyCellId;
  readonly title: string;
  readonly body: string;
};

export type ValueReportContributingRunStamp = {
  readonly isSample?: boolean | null;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly workingCareerRehearsalDoor?: string | null;
};

const MAX_PERIOD_CONTRIBUTING_RUN_LOOKUPS = 10;

export function capValueReportContributingRunIds(runIds: readonly string[]): readonly string[] {
  const unique: string[] = [];

  for (const runId of runIds) {
    const trimmed = runId.trim();

    if (trimmed.length === 0 || unique.includes(trimmed)) {
      continue;
    }

    unique.push(trimmed);

    if (unique.length >= MAX_PERIOD_CONTRIBUTING_RUN_LOOKUPS) {
      break;
    }
  }

  return unique;
}

export function shouldApplyValueReportRehearsalHonesty(
  stamp: ValueReportContributingRunStamp,
): boolean {
  if (stamp.isSample === true) {
    return false;
  }

  const effectiveDoor =
    (stamp.workingCareerRehearsalDoor?.trim() as WorkingCareerRehearsalDoorId | undefined) ??
    DEFAULT_WORKING_CAREER_REHEARSAL_DOOR;

  if (
    effectiveDoor === "career"
    && stamp.structuralExecutionMode === StructuralExecutionModeWire.Real
  ) {
    return false;
  }

  return true;
}

export function periodContributingRunsRequireHonesty(
  stamps: readonly ValueReportContributingRunStamp[],
): boolean {
  return stamps.some((stamp) => shouldApplyValueReportRehearsalHonesty(stamp));
}

function presentationForScopedCell(
  cellId: RunStatusBadgeWorkingCareerHonestyCellId,
): ValueReportCareerHonestyPresentation {
  if (cellId === "career-simulator-blocked") {
    return {
      kind: "scoped",
      cellId,
      title: VALUE_REPORT_SCOPED_CAREER_BLOCKED_TITLE,
      body: VALUE_REPORT_SCOPED_CAREER_BLOCKED_BODY,
    };
  }

  if (cellId === "rehearsal-simulator") {
    return {
      kind: "scoped",
      cellId,
      title: VALUE_REPORT_SCOPED_REHEARSAL_INCOMPLETE_TITLE,
      body: VALUE_REPORT_SCOPED_REHEARSAL_INCOMPLETE_BODY,
    };
  }

  return {
    kind: "scoped",
    cellId,
    title: VALUE_REPORT_SCOPED_PRACTICE_TITLE,
    body: VALUE_REPORT_SCOPED_PRACTICE_BODY,
  };
}

export function resolveValueReportScopedCareerHonesty(
  input: RunStatusBadgeWorkingCareerHonestyInput & {
    readonly isSample?: boolean | null;
  },
): ValueReportCareerHonestyPresentation | null {
  if (input.isSample === true) {
    return null;
  }

  const cellId = resolveRunStatusBadgeWorkingCareerHonestyCell(input);

  if (cellId === null || cellId === "career-real") {
    return null;
  }

  return presentationForScopedCell(cellId);
}

export function resolveValueReportCareerHonesty(input: {
  readonly isSample?: boolean | null;
  readonly scopedHonesty: ValueReportCareerHonestyPresentation | null;
  readonly periodRequiresHonesty: boolean;
}): ValueReportCareerHonestyPresentation | null {
  if (input.isSample === true) {
    return null;
  }

  if (input.scopedHonesty !== null) {
    return input.scopedHonesty;
  }

  if (input.periodRequiresHonesty) {
    return {
      kind: "period-mix",
      title: VALUE_REPORT_PERIOD_MIX_TITLE,
      body: VALUE_REPORT_PERIOD_MIX_BODY,
    };
  }

  return null;
}

export function resolveValueReportClaimDiscipline(
  baseDiscipline: string,
  presentation: ValueReportCareerHonestyPresentation | null,
): string {
  if (presentation === null) {
    return baseDiscipline;
  }

  return `${baseDiscipline} ${VALUE_REPORT_MEASURED_SAVINGS_DISCLAIMER}`;
}
