import { getDraftRequest } from "@/lib/api/draft-intake-api";
import type { RunDetailCriticalPageBundle } from "@/lib/fetch-run-detail-page-bundle-client";
import { listPresenterAssertedAnswerEntries } from "@/lib/reviews/review-presenter-asserted-trail";
import type { TransparencyTrail } from "@/types/feasibility-verdict";

function trailHasPresenterAnswers(trail: TransparencyTrail | null | undefined): boolean {
  return listPresenterAssertedAnswerEntries(trail).length > 0;
}

/**
 * Resolves transparency trail for package print meeting capture (PC-09 optional).
 * Prefers manifest summary when room answers are present; otherwise falls back to the linked draft document.
 */
export async function resolvePackagePrintTransparencyTrail(
  bundle: RunDetailCriticalPageBundle,
): Promise<TransparencyTrail | null> {
  const manifestTrail = bundle.manifestSummary?.feasibilityVerdict?.transparencyTrail ?? null;

  if (trailHasPresenterAnswers(manifestTrail)) {
    return manifestTrail;
  }

  const draftId = bundle.buyerSummary.run.architectureRequestId?.trim() ?? "";

  if (draftId.length === 0) {
    return manifestTrail;
  }

  try {
    const draft = await getDraftRequest(draftId);
    const draftTrail = draft.document?.transparencyTrail ?? null;

    if (trailHasPresenterAnswers(draftTrail)) {
      return draftTrail;
    }
  } catch {
    // Draft may be unavailable after finalize — manifest trail (possibly empty) remains honest.
  }

  return manifestTrail ?? null;
}
