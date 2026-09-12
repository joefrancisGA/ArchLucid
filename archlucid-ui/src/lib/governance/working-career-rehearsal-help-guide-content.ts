/** AS-082 — in-app help topic: Practice vs Record review types (architecture-spine-082; user copy ADR 0097). */
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { CONNECTION_STATUS_HELP_CANONICAL_PATH } from "@/lib/connection-status-help-evidence-copy";
import {
  WORKING_CAREER_DOOR_DETAIL,
  WORKING_CAREER_DOOR_LABEL,
  WORKING_REHEARSAL_DOOR_DETAIL,
  WORKING_REHEARSAL_DOOR_LABEL,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  WORKING_CAREER_REHEARSAL_HELP_PATH,
  WORKING_CAREER_REHEARSAL_HELP_SECURITY_HEADING_ID,
} from "@/lib/governance/working-career-rehearsal-help-route";

export const WORKING_CAREER_REHEARSAL_HELP_PAGE_TITLE = "Record and Practice";

export const WORKING_CAREER_REHEARSAL_HELP_PAGE_SUBTITLE =
  "Choose the review type that matches your intent — dry-runs in Practice, sealed-record proof in Record.";

export const WORKING_CAREER_REHEARSAL_HELP_OVERVIEW =
  "On Working seats, the operator top bar exposes two labeled review types. Practice is for dry-runs with Simulator or Fallback execute and practice labeling on artifacts. Record is the sealed-record path when live AI is ready — not a silent host configuration flip.";

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
    whenToUse: "Use Record when you are preparing sponsor exports, finalize honesty, and audit-ready proof with live execute.",
  },
  {
    id: "rehearsal",
    label: WORKING_REHEARSAL_DOOR_LABEL,
    detail: WORKING_REHEARSAL_DOOR_DETAIL,
    whenToUse: "Use Practice for dry-runs, teaching walkthroughs, and local Simulator clones — rehearsal, not procurement proof.",
  },
] as const;

export const WORKING_CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY_TITLE = "Simulator is not sponsor proof";

export const WORKING_CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY_COPY =
  "Simulator and Fallback output stays labeled incomplete on sealed-record surfaces. Screenshots, Ready-to-finalize chrome, and sponsor exports must not borrow sealed-record authority from Practice runs. Guided, demo, and trial seats keep Simulator teaching without this chooser.";

export const WORKING_CAREER_REHEARSAL_HELP_GUIDED_NOTE =
  "Guided workspace mode keeps teaching chrome and does not show the Record / Practice chooser. Switch to Working when you need explicit livelihood intent on the paying desk.";

export const WORKING_CAREER_REHEARSAL_HELP_SECURITY_TITLE = "Security product line";

export const WORKING_CAREER_REHEARSAL_HELP_SECURITY_COPY =
  "The SecureNow (Security) product shell does not include Record / Practice review types — that Working execution intent applies to Architecture review workflows only. SecureNow omits the chooser and related top-bar chrome entirely.";

export const WORKING_CAREER_REHEARSAL_HELP_PRIMARY_ACTION = {
  label: "Check connection status",
  href: CONNECTION_STATUS_HELP_CANONICAL_PATH,
} as const;

export const WORKING_CAREER_REHEARSAL_HELP_RELATED = {
  label: "Getting started",
  href: inAppHelpHref("getting-started"),
} as const;

export const WORKING_CAREER_REHEARSAL_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "which-door", title: "Which review type should I use?" },
  { level: 2, id: "simulator-honesty", title: WORKING_CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY_TITLE },
  { level: 2, id: "guided-vs-working", title: "Guided vs Working" },
  {
    level: 2,
    id: WORKING_CAREER_REHEARSAL_HELP_SECURITY_HEADING_ID,
    title: WORKING_CAREER_REHEARSAL_HELP_SECURITY_TITLE,
  },
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
