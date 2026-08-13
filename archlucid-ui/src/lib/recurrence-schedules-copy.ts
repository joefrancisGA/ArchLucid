import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";

/** Page copy and navigation targets for governance recurrence schedules. */

/** Single above-the-fold lead under the page title (TB-1130 — no wall of governance prose). */
export const RECURRENCE_SCHEDULES_PAGE_SUBTITLE =
  "Automate follow-up review cadences for governed architecture reviews.";

export const RECURRENCE_SCHEDULES_HOW_IT_WORKS_TITLE = "How recurrence schedules work";

/** Folded value + trust copy — shown only inside How-it-works disclosure (TB-1130). */
export const RECURRENCE_SCHEDULES_HOW_IT_WORKS_BODY =
  "Define repeatable review cadences for finalized architecture reviews — quarterly control reviews, annual policy attestations, post-remediation follow-ups, and architecture board checkpoints. When a schedule comes due, ArchLucid creates a follow-up architecture review from the source review. Schedules help ensure that accepted risks, policy exceptions, and governed architecture decisions are reviewed on time instead of being forgotten after approval.";

export const RECURRENCE_SCHEDULES_EMPTY_TITLE = "No recurrence schedules yet";

export const RECURRENCE_SCHEDULES_EMPTY_DESCRIPTION =
  "When a schedule comes due, ArchLucid creates a follow-up architecture review from the source review. You need a finalized architecture review before you can schedule one.";

/** @deprecated Prefer `RECURRENCE_SCHEDULES_HOW_IT_WORKS_BODY` — folded under How-it-works (TB-1130). */
export const RECURRENCE_SCHEDULES_EMPTY_SUPPORTING =
  "Schedules help ensure that accepted risks, policy exceptions, and governed architecture decisions are reviewed on time instead of being forgotten after approval.";

export const RECURRENCE_SCHEDULES_HELPER_TITLE = "Governance workflow";

export const RECURRENCE_SCHEDULES_HELPER_BODY =
  "Use recurrence schedules to create follow-up architecture reviews when governed reviews need periodic re-review. Recipients and notifications are not configured on this page.";

export const RECURRENCE_SCHEDULES_HELPER_NEXT_STEP =
  "Start with a finalized architecture review, then define the review cadence.";

export const RECURRENCE_SCHEDULES_EXAMPLES_HEADING = "Common schedule examples";

/** TB-1132 — human cadence leads; cron is secondary data for create population. */
export type RecurrenceScheduleExample = {
  readonly title: string;
  readonly humanCadence: string;
  readonly cronExpression: string;
  readonly whenToUse: string;
};

export const RECURRENCE_SCHEDULE_EXAMPLES: readonly RecurrenceScheduleExample[] = [
  {
    title: "Quarterly control validation",
    humanCadence: "Quarterly on the 1st at 08:00 UTC",
    cronExpression: "0 8 1 */3 *",
    whenToUse: "Re-run control checks on a committed architecture review after each quarter closes.",
  },
  {
    title: "Annual policy attestation",
    humanCadence: "Annually on January 1 at 08:00 UTC",
    cronExpression: "0 8 1 1 *",
    whenToUse: "Confirm policy alignment and attestations once per year for governed systems.",
  },
  {
    title: "Post-remediation follow-up",
    humanCadence: "Weekly on Monday at 08:00 UTC",
    cronExpression: "0 8 * * 1",
    whenToUse: "Verify remediation evidence and residual risk after a finding is marked remediated.",
  },
  {
    title: "Architecture board review cadence",
    humanCadence: "Monthly on the 1st at 08:00 UTC",
    cronExpression: "0 8 1 * *",
    whenToUse: "Bring recurring architecture board checkpoints back on schedule for active programs.",
  },
] as const;

/** Governed reviews index. */
export const RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF = "/architecture/reviews";

/** Pending approvals live on the Approval queue page (no standalone list route yet). */
export const RECURRENCE_SCHEDULES_PENDING_APPROVALS_HREF = GOVERNANCE_APPROVAL_QUEUE_PATH;
/** Architecture risk register. */
export const RECURRENCE_SCHEDULES_RISK_REGISTER_HREF = "/governance/findings";

export const RECURRENCE_SCHEDULES_MANAGE_PATH = "/governance/recurrence-schedules";
