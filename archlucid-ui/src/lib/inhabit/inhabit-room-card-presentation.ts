import { deriveWorkingInstrumentReviewHeaderPresentation } from "@/lib/run-detail-workspace-derive/review-presentation";

export type InhabitRoomCardHeaderPresentation = {
  readonly architectureTitle: string;
  readonly jobSubtitle: string | null;
};

/** IH-054 — room card identity is architecture plus open job subtitle. */
export function resolveInhabitRoomCardHeaderPresentation(input: {
  readonly architectureDisplayName: string;
  readonly scopedRunTitle?: string | null;
  readonly scopedRunId?: string | null;
}): InhabitRoomCardHeaderPresentation {
  const architectureTitle = deriveWorkingInstrumentReviewHeaderPresentation({
    architectureDisplayName: input.architectureDisplayName.trim(),
    reviewTitle: "",
    runId: "",
  }).h1Title;

  const runTitle = input.scopedRunTitle?.trim() ?? "";
  const runId = input.scopedRunId?.trim() ?? "";

  let jobSubtitle: string | null = null;

  if (runTitle.length > 0) {
    jobSubtitle = runTitle;
  } else if (runId.length > 0) {
    jobSubtitle = runId;
  }

  return {
    architectureTitle,
    jobSubtitle,
  };
}
