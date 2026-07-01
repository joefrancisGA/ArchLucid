/** Page copy and navigation targets for governance recurrence schedules. */

export const RECURRENCE_SCHEDULES_PAGE_SUBTITLE =
  "Automate follow-up reviews for architecture packages that require periodic governance, control validation, remediation tracking, or policy re-review.";

export const RECURRENCE_SCHEDULES_EMPTY_TITLE = "No recurrence schedules yet";

export const RECURRENCE_SCHEDULES_EMPTY_DESCRIPTION =
  "Create a recurrence schedule when an architecture package needs periodic review, such as quarterly control validation, annual policy review, post-remediation follow-up, or recurring architecture board review.";

export const RECURRENCE_SCHEDULES_EMPTY_SUPPORTING =
  "Schedules help ensure that accepted risks, policy exceptions, and governed architecture decisions are reviewed on time instead of being forgotten after approval.";

export const RECURRENCE_SCHEDULES_HELPER_TITLE = "Governance workflow";

export const RECURRENCE_SCHEDULES_HELPER_BODY =
  "Use recurrence schedules to make sure governed architecture packages are reviewed again when risks, policy exceptions, or control obligations require follow-up.";

export const RECURRENCE_SCHEDULES_HELPER_NEXT_STEP =
  "Start by choosing a governed review package, then define the review cadence and owner.";

export const RECURRENCE_SCHEDULES_EXAMPLES_HEADING = "Common schedule examples";

export type RecurrenceScheduleExample = {
  readonly title: string;
  readonly cadence: string;
  readonly whenToUse: string;
};

export const RECURRENCE_SCHEDULE_EXAMPLES: readonly RecurrenceScheduleExample[] = [
  {
    title: "Quarterly control validation",
    cadence: "0 8 1 */3 *",
    whenToUse: "Re-run control checks on a committed architecture package after each quarter closes.",
  },
  {
    title: "Annual policy attestation",
    cadence: "0 8 1 1 *",
    whenToUse: "Confirm policy alignment and attestations once per year for governed systems.",
  },
  {
    title: "Post-remediation follow-up",
    cadence: "0 8 * * 1",
    whenToUse: "Verify remediation evidence and residual risk after a finding is marked remediated.",
  },
  {
    title: "Architecture board review cadence",
    cadence: "0 8 1 * *",
    whenToUse: "Bring recurring architecture board checkpoints back on schedule for active programs.",
  },
] as const;

/** Governed review packages index. */
export const RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF = "/reviews?projectId=default";

/** Pending approvals live on the governance workflow page (no standalone list route yet). */
export const RECURRENCE_SCHEDULES_PENDING_APPROVALS_HREF = "/governance";

/** Architecture risk register. */
export const RECURRENCE_SCHEDULES_RISK_REGISTER_HREF = "/governance/findings";

export const RECURRENCE_SCHEDULES_MANAGE_PATH = "/governance/recurrence-schedules";
