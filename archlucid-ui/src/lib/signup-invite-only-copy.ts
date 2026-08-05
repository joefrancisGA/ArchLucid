/** Invite-only `/signup` copy — controlled evaluation posture (no “private beta” / seat-scarcity framing). */

export const SIGNUP_INVITE_ONLY_PANEL_HEADING = "Evaluation access request";

export const SIGNUP_INVITE_ONLY_PANEL_LEAD =
  "Enter your work email below. We review each request and send an evaluation workspace invitation when approved—typically within two business days.";

export const SIGNUP_INVITE_ONLY_FORM_INTRO =
  "This starts a guided evaluation workspace request—not instant product access, checkout, or a procurement diligence package.";

/** Primary submit — action on filled fields, not a click-to-reveal gate. */
export const SIGNUP_INVITE_ONLY_SUBMIT_LABEL = "Send evaluation request";

export const SIGNUP_INVITE_ONLY_THANKS =
  "Thanks. We typically respond within two business days with next steps or an evaluation invitation.";

export type SignupInviteOnlyOutcome = {
  readonly label: string;
  readonly detail: string;
};

/** Compact outcomes under the form — no duplicate nav destinations. */
export const SIGNUP_INVITE_ONLY_OUTCOMES: readonly SignupInviteOnlyOutcome[] = [
  {
    label: "What you receive",
    detail: "An invitation to create an evaluation workspace with sample architecture review data.",
  },
  {
    label: "Response time",
    detail: "Human follow-up within two business days on typical requests.",
  },
] as const;

export const SIGNUP_PAGE_INVITE_ONLY_LEAD =
  "Enter your details to request an evaluation workspace for your organization. When approved, you receive an invitation—typically within two business days.";
