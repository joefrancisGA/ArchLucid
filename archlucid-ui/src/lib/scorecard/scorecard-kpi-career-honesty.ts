import {
  resolveRunStatusBadgeWorkingCareerHonestyCell,
  type RunStatusBadgeWorkingCareerHonestyCellId,
  type RunStatusBadgeWorkingCareerHonestyInput,
} from "@/lib/runs/run-status-badge-career-honesty";

/** CG-034 — scorecard KPI honesty when Working stamp is not Career-complete. */
export const SCORECARD_KPI_CAREER_BLOCKED_TITLE = "Career blocked — scorecard KPIs are not career proof";

export const SCORECARD_KPI_CAREER_BLOCKED_BODY =
  "These metrics reflect Simulator or Fallback execution on the Career door. Numbers stay visible for rehearsal — do not paste them into sponsor or procurement slides as career evidence.";

export const SCORECARD_KPI_REHEARSAL_INCOMPLETE_TITLE =
  "Rehearsal incomplete — scorecard KPIs are rehearsal only";

export const SCORECARD_KPI_REHEARSAL_INCOMPLETE_BODY =
  "These metrics reflect a Rehearsal door run on Simulator or Fallback. Numbers stay visible for practice — they are not career-complete sealed-record proof.";

export const SCORECARD_KPI_PRACTICE_TITLE = "Practice — scorecard KPIs are not career proof";

export const SCORECARD_KPI_PRACTICE_BODY =
  "These metrics reflect a Rehearsal door practice run on Real structural execute. Numbers stay visible for rehearsal — they are not sponsor-ready career evidence.";

export const SCORECARD_KPI_REHEARSAL_SECTION_QUALIFIER = "Rehearsal metrics";

export const SCORECARD_KPI_PRACTICE_SECTION_QUALIFIER = "Practice metrics";

export type ScorecardKpiCareerHonestyPresentation = {
  readonly cellId: RunStatusBadgeWorkingCareerHonestyCellId;
  readonly title: string;
  readonly body: string;
  readonly kpiSectionQualifier: string;
};

function presentationForCell(
  cellId: RunStatusBadgeWorkingCareerHonestyCellId,
): ScorecardKpiCareerHonestyPresentation {
  if (cellId === "career-simulator-blocked") {
    return {
      cellId,
      title: SCORECARD_KPI_CAREER_BLOCKED_TITLE,
      body: SCORECARD_KPI_CAREER_BLOCKED_BODY,
      kpiSectionQualifier: SCORECARD_KPI_REHEARSAL_SECTION_QUALIFIER,
    };
  }

  if (cellId === "rehearsal-simulator") {
    return {
      cellId,
      title: SCORECARD_KPI_REHEARSAL_INCOMPLETE_TITLE,
      body: SCORECARD_KPI_REHEARSAL_INCOMPLETE_BODY,
      kpiSectionQualifier: SCORECARD_KPI_REHEARSAL_SECTION_QUALIFIER,
    };
  }

  return {
    cellId,
    title: SCORECARD_KPI_PRACTICE_TITLE,
    body: SCORECARD_KPI_PRACTICE_BODY,
    kpiSectionQualifier: SCORECARD_KPI_PRACTICE_SECTION_QUALIFIER,
  };
}

export function resolveScorecardKpiCareerHonesty(
  input: RunStatusBadgeWorkingCareerHonestyInput & {
    readonly isSample?: boolean | null;
  },
): ScorecardKpiCareerHonestyPresentation | null {
  if (input.isSample === true) {
    return null;
  }

  const cellId = resolveRunStatusBadgeWorkingCareerHonestyCell(input);

  if (cellId === null || cellId === "career-real") {
    return null;
  }

  return presentationForCell(cellId);
}

export function resolveScorecardKpiSectionHeading(
  baseHeading: string,
  kpiSectionQualifier: string | null,
): string {
  if (kpiSectionQualifier === null || kpiSectionQualifier.trim().length === 0) {
    return baseHeading;
  }

  return `${baseHeading} — ${kpiSectionQualifier}`;
}
