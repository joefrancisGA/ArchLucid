/** Copy for recurrence schedule activation and AI-budget disclosure (TB-222). */

export const RECURRENCE_AI_BUDGET_DISCLOSURE =
  "Each scheduled assessment runs the full architecture review pipeline and may consume AI budget.";

export const RECURRENCE_EACH_OCCURRENCE_NOTE =
  "Each occurrence creates a new assessment run by cloning the source review.";

export const RECURRENCE_SAVE_PAUSED_LABEL = "Save schedule (paused)";

export const RECURRENCE_ENABLE_RECURRING_LABEL = "Enable recurring assessments";

export const RECURRENCE_SAVE_CHANGES_LABEL = "Save changes";

export const RECURRENCE_ACTIVATION_SUMMARY_HEADING = "Schedule summary";

/** TB-2192 — post-commit proposal framing, explicit decline, and honest recipient disclosure. */

export const RECURRENCE_PROPOSAL_LEAD =
  "A weekly cadence is proposed for this committed review. Enable it to keep governance current, change the cadence first, or decline.";

export const RECURRENCE_DECLINE_LABEL = "Not now";

export const RECURRENCE_DECLINED_STATUS =
  "Declined. No schedule was created, and this review will not propose one again.";

/**
 * Recipients come from `DapperExecutiveSummaryRecipientLookup` (every active Admin, Sponsor, and
 * WorkspaceAdmin) plus the schedule creator. Only a global server option gates delivery, so there
 * is no per-recipient opt-out to promise.
 */
export const RECURRENCE_COMPLETION_RECIPIENTS_DISCLOSURE =
  "Each completed occurrence emails you and every active workspace admin and sponsor. Per-recipient opt-out is not available yet.";
