import {
  resolveBaselineReviewSourceNoteDisplay,
  type TenantBaselineSnapshot,
} from "@/lib/baseline-settings-present";

export function parseNumberOrNull(raw: string): number | null {
  const t = raw.trim();

  if (t.length === 0) {
    return null;
  }

  const n = Number(t);

  if (!Number.isFinite(n)) {
    return Number.NaN;
  }

  return n;
}

export function snapshotFromForm(
  reviewHours: string,
  reviewNote: string,
  manualPrep: string,
  people: string,
): TenantBaselineSnapshot {
  const reviewParsed = parseNumberOrNull(reviewHours);
  const prepParsed = parseNumberOrNull(manualPrep);
  const peopleParsed = parseNumberOrNull(people);

  return {
    manualPrepHoursPerReview: Number.isNaN(prepParsed) ? null : prepParsed,
    peoplePerReview: Number.isNaN(peopleParsed) ? null : peopleParsed,
    capturedUtc: null,
    baselineReviewCycleHours: Number.isNaN(reviewParsed) ? null : reviewParsed,
    baselineReviewCycleSource: reviewNote.trim().length > 0 ? reviewNote.trim() : null,
    baselineReviewCycleCapturedUtc: null,
  };
}

export function applySnapshotToFields(
  data: TenantBaselineSnapshot,
  setters: {
    setManualPrep: (value: string) => void;
    setPeople: (value: string) => void;
    setReviewHours: (value: string) => void;
    setReviewNote: (value: string) => void;
  },
): void {
  setters.setManualPrep(
    data.manualPrepHoursPerReview != null && Number.isFinite(data.manualPrepHoursPerReview)
      ? String(data.manualPrepHoursPerReview)
      : "",
  );
  setters.setPeople(
    data.peoplePerReview != null && Number.isFinite(data.peoplePerReview) ? String(data.peoplePerReview) : "",
  );
  setters.setReviewHours(
    data.baselineReviewCycleHours != null && Number.isFinite(data.baselineReviewCycleHours)
      ? String(data.baselineReviewCycleHours)
      : "",
  );
  setters.setReviewNote(resolveBaselineReviewSourceNoteDisplay(data.baselineReviewCycleSource) ?? "");
}
