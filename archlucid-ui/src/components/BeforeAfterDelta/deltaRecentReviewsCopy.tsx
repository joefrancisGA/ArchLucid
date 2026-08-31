/**
 * Shared operator copy for recent-finalized-review median summaries (sidebar + top variants).
 * Kept in one module so tooltip and heading semantics stay aligned.
 */

export const DELTA_RECENT_REVIEWS_SIDEBAR_HELP = (
  <>
  <p className="m-0">
    Shows the <strong>median</strong> across your most recent finalized reviews — not a change since your last visit.
  </p>
  <p className="mb-0 mt-2">
    <strong>Findings / review</strong> is how many issues each finished review raised, not open issues in your queue.{" "}
    <strong>Time to finalize</strong> is wall-clock from review start to finalize; sub-minute reviews may show as 0.00 h.
  </p>
  </>
);
