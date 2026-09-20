import {
  WORKING_CAREER_DOOR_LABEL,
  WORKING_REHEARSAL_DOOR_LABEL,
} from "@/lib/governance/working-career-rehearsal-door-copy";

export const FIRST_SESSION_PURPOSE_CHOOSER_TITLE = "How do you want to start?";

export const FIRST_SESSION_PURPOSE_LIVE_CTA = "Start in my workspace";

export const FIRST_SESSION_PURPOSE_LIVE_BODY =
  "This is your organization's workspace. Reviews you start here use your live data.";

export const FIRST_SESSION_PURPOSE_TRAINING_CTA = "Training";

export const FIRST_SESSION_PURPOSE_TRAINING_BODY =
  "Learn ArchLucid with sample data. This is not your tenant and is not a live architecture review.";

export const FIRST_SESSION_PURPOSE_CHOOSER_TEST_ID = "first-session-purpose-chooser";

export const FIRST_SESSION_PURPOSE_LIVE_BUTTON_TEST_ID = "first-session-purpose-live";

export const FIRST_SESSION_PURPOSE_TRAINING_BUTTON_TEST_ID = "first-session-purpose-training";

/** Guards copy drift against Record/Practice door labels. */
export function firstSessionPurposeCopyDoesNotCollideWithReviewDoors(): boolean {
  return (
    FIRST_SESSION_PURPOSE_TRAINING_CTA !== WORKING_REHEARSAL_DOOR_LABEL
    && FIRST_SESSION_PURPOSE_TRAINING_CTA !== WORKING_CAREER_DOOR_LABEL
    && !FIRST_SESSION_PURPOSE_LIVE_CTA.toLowerCase().includes("sample")
    && !FIRST_SESSION_PURPOSE_LIVE_CTA.toLowerCase().includes("demo")
  );
}
