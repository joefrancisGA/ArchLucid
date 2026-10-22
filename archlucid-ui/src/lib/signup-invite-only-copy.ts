/** Invite-only `/signup` copy — controlled evaluation posture (no “private beta” / seat-scarcity framing). */

/** Shared response-time line — referenced once in panel lead and thanks to avoid repetition. */
export const SIGNUP_INVITE_ONLY_RESPONSE_TIME =
  "We typically respond within two business days with next steps or an evaluation invitation.";

export const SIGNUP_INVITE_ONLY_PANEL_HEADING = "Evaluation access request";

export const SIGNUP_INVITE_ONLY_PANEL_LEAD =
  "Enter your work email below. We review each request and send an evaluation workspace invitation when approved.";

export const SIGNUP_INVITE_ONLY_FORM_INTRO =
  "This starts a guided evaluation workspace reques — ot instant product access, checkout, or a procurement diligence trail.";

/** Primary submit — action on filled fields, not a click-to-reveal gate. */
export const SIGNUP_INVITE_ONLY_SUBMIT_LABEL = "Send evaluation request";

export const SIGNUP_INVITE_ONLY_SECONDARY_CTA_LABEL = "See a sample review";

export const SIGNUP_INVITE_ONLY_THANKS = `Thanks. ${SIGNUP_INVITE_ONLY_RESPONSE_TIME}`;

export const SIGNUP_INVITE_ONLY_DATA_USE_LINE =
  "We use your email to review this request and send evaluation invitations. See our";

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
    detail: "Human follow-up on typical request — ee confirmation email for timing.",
  },
] as const;

export const SIGNUP_PAGE_INVITE_ONLY_LEAD =
  "Enter your details to request an evaluation workspace for your organization. When approved, you receive an invitation with next steps.";

export type SignupProcessStep = {
  readonly title: string;
  readonly detail: string;
};

/** Ordered steps for the `/signup` evaluation aside rail. */
export const SIGNUP_PROCESS_HEADING = "What happens next";

export const SIGNUP_PROCESS_STEPS: readonly SignupProcessStep[] = [
  {
    title: "Submit your request",
    detail:
      "Share your work email, organization, and optional role so we can scope an evaluation workspace.",
  },
  {
    title: "Human review",
    detail:
      "We review each request and follow up with approval, questions, or next steps.",
  },
  {
    title: "Workspace invitation",
    detail:
      "Approved requests receive an invitation to create an evaluation workspace with sample architecture review data.",
  },
  {
    title: "Sign in and explore",
    detail:
      "Use your work account or a one-time email code. No checkout or procurement package is required to start.",
  },
] as const;

export const SIGNUP_DEMO_PATH_NOTE =
  "Need a live walkthrough before requesting access? Use Request demo on Pricing for a guided sessio — his form starts an evaluation workspace, not a sales demo.";

export type SignupAssuranceFact = {
  readonly label: string;
  readonly detail: string;
};

/** Verifiable evaluation posture — no false certification claims. */
export const SIGNUP_ASSURANCE_HEADING = "Evaluation workspace posture";

export const SIGNUP_ASSURANCE_FACTS: readonly SignupAssuranceFact[] = [
  {
    label: "Tenant-scoped workspace",
    detail:
      "Each evaluation workspace is isolated to your organizatio — o shared demo tenant across unrelated buyers.",
  },
  {
    label: "No payment to start",
    detail: "Evaluation access is not instant checkout. We confirm fit before inviting you in.",
  },
  {
    label: "Trust materials on request",
    detail:
      "Security overview, data handling, and scope claims are in our Trust Cente — ot overstated on this form.",
  },
  {
    label: "Inspect before you commit",
    detail: "Explore a sample review without an account while your request is in review.",
  },
] as const;
