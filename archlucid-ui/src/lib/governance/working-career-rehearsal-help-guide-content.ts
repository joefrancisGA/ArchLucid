/** AS-082 — in-app help topic: Rehearsal vs Career doors (architecture-spine-082). */
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { CONNECTION_STATUS_HELP_CANONICAL_PATH } from "@/lib/connection-status-help-evidence-copy";
import {
  WORKING_CAREER_DOOR_DETAIL,
  WORKING_CAREER_DOOR_LABEL,
  WORKING_REHEARSAL_DOOR_DETAIL,
  WORKING_REHEARSAL_DOOR_LABEL,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { WORKING_CAREER_REHEARSAL_HELP_PATH } from "@/lib/governance/working-career-rehearsal-help-route";

export const WORKING_CAREER_REHEARSAL_HELP_PAGE_TITLE = "Career and Rehearsal doors";

export const WORKING_CAREER_REHEARSAL_HELP_PAGE_SUBTITLE =
  "Choose the Working execution door that matches your intent — practice in Rehearsal, sealed-record proof in Career.";

export const WORKING_CAREER_REHEARSAL_HELP_OVERVIEW =
  "On Working seats, the operator top bar exposes two labeled doors. Rehearsal is practice with Simulator or Fallback execute and rehearsal labeling on artifacts. Career is the sealed-record path when live AI is ready — not a silent host configuration flip.";

export type WorkingCareerRehearsalHelpDoorTile = {
  readonly id: "career" | "rehearsal";
  readonly label: string;
  readonly detail: string;
  readonly whenToUse: string;
};

export const WORKING_CAREER_REHEARSAL_HELP_DOOR_TILES: readonly WorkingCareerRehearsalHelpDoorTile[] = [
  {
    id: "career",
    label: WORKING_CAREER_DOOR_LABEL,
    detail: WORKING_CAREER_DOOR_DETAIL,
    whenToUse: "Use Career when you are preparing sponsor exports, finalize honesty, and audit-ready proof with live execute.",
  },
  {
    id: "rehearsal",
    label: WORKING_REHEARSAL_DOOR_LABEL,
    detail: WORKING_REHEARSAL_DOOR_DETAIL,
    whenToUse: "Use Rehearsal for dry-runs, teaching walkthroughs, and local Simulator clones — practice, not procurement proof.",
  },
] as const;

export const WORKING_CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY_TITLE = "Simulator is not sponsor proof";

export const WORKING_CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY_COPY =
  "Simulator and Fallback output stays labeled incomplete on career surfaces. Screenshots, Ready-to-finalize chrome, and sponsor exports must not borrow career authority from Rehearsal runs. Guided, demo, and trial seats keep Simulator teaching without this chooser.";

export const WORKING_CAREER_REHEARSAL_HELP_GUIDED_NOTE =
  "Guided workspace mode keeps teaching chrome and does not show the Career / Rehearsal chooser. Switch to Working when you need explicit livelihood intent on the paying desk.";

export const WORKING_CAREER_REHEARSAL_HELP_PRIMARY_ACTION = {
  label: "Check connection status",
  href: CONNECTION_STATUS_HELP_CANONICAL_PATH,
} as const;

export const WORKING_CAREER_REHEARSAL_HELP_RELATED = {
  label: "Getting started",
  href: inAppHelpHref("getting-started"),
} as const;

export const WORKING_CAREER_REHEARSAL_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "which-door", title: "Which door should I use?" },
  { level: 2, id: "simulator-honesty", title: WORKING_CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY_TITLE },
  { level: 2, id: "guided-vs-working", title: "Guided vs Working" },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard — in-app help must not deep-link GitHub blob URLs. */
export const WORKING_CAREER_REHEARSAL_HELP_FORBIDDEN_LINK_MARKERS = [
  "github.com",
  "/blob/",
] as const;

export const WORKING_CAREER_REHEARSAL_HELP_CANONICAL_HANDOFF_MARKERS = [
  WORKING_CAREER_REHEARSAL_HELP_PATH,
  "career-rehearsal-doors",
  "WORKING_CAREER_REHEARSAL_HELP_PATH",
] as const;
