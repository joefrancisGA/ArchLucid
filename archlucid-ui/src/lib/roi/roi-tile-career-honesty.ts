import {
  resolveRunStatusBadgeWorkingCareerHonestyCell,
  type RunStatusBadgeWorkingCareerHonestyCellId,
  type RunStatusBadgeWorkingCareerHonestyInput,
} from "@/lib/runs/run-status-badge-career-honesty";

/** CG-035 — ROI / value-report tile honesty when Working stamp is not Career-complete. */
export const ROI_TILE_CAREER_BLOCKED_TITLE = "Career blocked — ROI tiles are not career proof";

export const ROI_TILE_CAREER_BLOCKED_BODY =
  "Directional savings shown here include Simulator or Fallback execution on the Career door. Figures stay visible for rehearsal — do not cite them as measured procurement savings.";

export const ROI_TILE_REHEARSAL_INCOMPLETE_TITLE = "Rehearsal incomplete — ROI is rehearsal only";

export const ROI_TILE_REHEARSAL_INCOMPLETE_BODY =
  "Directional savings reflect a Rehearsal door run on Simulator or Fallback. Numbers stay visible for practice — they are not career-complete sealed-record proof.";

export const ROI_TILE_PRACTICE_TITLE = "Practice — ROI is not career proof";

export const ROI_TILE_PRACTICE_BODY =
  "Directional savings reflect a Rehearsal door practice run on Real structural execute. Figures stay visible for rehearsal — they are not sponsor-ready career evidence.";

export const ROI_TILE_REHEARSAL_SECTION_QUALIFIER = "Rehearsal ROI";

export const ROI_TILE_PRACTICE_SECTION_QUALIFIER = "Practice ROI";

export type RoiTileCareerHonestyPresentation = {
  readonly cellId: RunStatusBadgeWorkingCareerHonestyCellId;
  readonly title: string;
  readonly body: string;
  readonly roiSectionQualifier: string;
};

function presentationForCell(
  cellId: RunStatusBadgeWorkingCareerHonestyCellId,
): RoiTileCareerHonestyPresentation {
  if (cellId === "career-simulator-blocked") {
    return {
      cellId,
      title: ROI_TILE_CAREER_BLOCKED_TITLE,
      body: ROI_TILE_CAREER_BLOCKED_BODY,
      roiSectionQualifier: ROI_TILE_REHEARSAL_SECTION_QUALIFIER,
    };
  }

  if (cellId === "rehearsal-simulator") {
    return {
      cellId,
      title: ROI_TILE_REHEARSAL_INCOMPLETE_TITLE,
      body: ROI_TILE_REHEARSAL_INCOMPLETE_BODY,
      roiSectionQualifier: ROI_TILE_REHEARSAL_SECTION_QUALIFIER,
    };
  }

  return {
    cellId,
    title: ROI_TILE_PRACTICE_TITLE,
    body: ROI_TILE_PRACTICE_BODY,
    roiSectionQualifier: ROI_TILE_PRACTICE_SECTION_QUALIFIER,
  };
}

export function resolveRoiTileCareerHonesty(
  input: RunStatusBadgeWorkingCareerHonestyInput & {
    readonly isSample?: boolean | null;
  },
): RoiTileCareerHonestyPresentation | null {
  if (input.isSample === true) {
    return null;
  }

  const cellId = resolveRunStatusBadgeWorkingCareerHonestyCell(input);

  if (cellId === null || cellId === "career-real") {
    return null;
  }

  return presentationForCell(cellId);
}

export function resolveRoiTileSectionHeading(
  baseHeading: string,
  roiSectionQualifier: string | null,
): string {
  if (roiSectionQualifier === null || roiSectionQualifier.trim().length === 0) {
    return baseHeading;
  }

  return `${baseHeading} — ${roiSectionQualifier}`;
}
