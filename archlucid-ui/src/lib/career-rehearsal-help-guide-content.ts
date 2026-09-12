import {
  WORKING_CAREER_REHEARSAL_INTENT_LABELS,
} from "@/lib/governance/working-career-rehearsal-intent";
import { SIMULATOR_REHEARSAL_GUIDED_WARNING } from "@/lib/governance/simulator-career-honesty";

export const CAREER_REHEARSAL_HELP_PAGE_TITLE = "Record vs Practice on the Working desk" as const;

export const CAREER_REHEARSAL_HELP_PAGE_SUBTITLE =
  "Pick the review type that matches whether you are building sealed-record evidence or running a labeled practice session." as const;

export const CAREER_REHEARSAL_HELP_OVERVIEW =
  "The Working desk chooser sets your intent for the session. Record and Practice are product review types — they do not flip host execution mode by themselves." as const;

export type CareerRehearsalHelpDoorCard = {
  readonly doorId: "career" | "rehearsal";
  readonly title: string;
  readonly body: string;
};

export const CAREER_REHEARSAL_HELP_DOOR_CARDS: readonly CareerRehearsalHelpDoorCard[] = [
  {
    doorId: "career",
    title: WORKING_CAREER_REHEARSAL_INTENT_LABELS.career,
    body:
      "Use Record when you are building evidence for finalize, export, and sponsor review. Record-complete artifacts require Real execution and honest citation coverage.",
  },
  {
    doorId: "rehearsal",
    title: WORKING_CAREER_REHEARSAL_INTENT_LABELS.rehearsal,
    body:
      "Use Practice when you are rehearsing the flow, practicing objections, or validating UI behavior without claiming sponsor proof.",
  },
] as const;

export const CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY =
  `${SIMULATOR_REHEARSAL_GUIDED_WARNING} Simulator output is not sponsor proof and does not satisfy record-complete gates.`;

export const CAREER_REHEARSAL_HELP_PRIMARY_CONTENT_ID = "career-rehearsal-help-primary-content" as const;

export const CAREER_REHEARSAL_HELP_FIRST_VIEWPORT_TEST_ID = "help-career-rehearsal-first-viewport" as const;
