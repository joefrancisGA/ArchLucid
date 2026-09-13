import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  WORKING_CAREER_DOOR_LABEL,
  WORKING_REHEARSAL_DOOR_LABEL,
} from "@/lib/governance/working-career-rehearsal-door-copy";

export const INHABIT_THE_ARCHITECTURE_HELP_SLUG = "inhabit-the-architecture" as const;

export const INHABIT_THE_ARCHITECTURE_HELP_PATH = `/help/${INHABIT_THE_ARCHITECTURE_HELP_SLUG}` as const;

export const INHABIT_THE_ARCHITECTURE_HELP_PAGE_TITLE = "Inhabit the architecture" as const;

export const INHABIT_THE_ARCHITECTURE_HELP_PAGE_SUBTITLE =
  "Working orientation — the system is what you inhabit; the review is a child job; findings are the afternoon’s document." as const;

export const INHABIT_THE_ARCHITECTURE_HELP_OVERVIEW =
  "On Working, when an architecture is open, you inhabit that system for the afternoon. Nested findings are the document you disposition — not a pipeline step and not Monday’s reviews inbox. Nested review-detail stays a job inspector when you need manifest, timeline, or package context." as const;

export const INHABIT_THE_ARCHITECTURE_HELP_GUIDE_HEADINGS = [
  { id: "what-is-this-desk", label: "What is this desk?" },
  { id: "what-to-do-next", label: "What to do next" },
  { id: "why-empty", label: "Why empty findings?" },
  { id: "record-vs-practice", label: "Record vs Practice" },
] as const;

export const INHABIT_THE_ARCHITECTURE_HELP_CONCEPT_TILES = [
  {
    id: "architecture",
    title: "Architecture is home",
    body: "The H1 is the architecture display name. Child reviews are subtitles — not a second product and not exile from the desk.",
  },
  {
    id: "findings-document",
    title: "Findings are the afternoon document",
    body: "Disposition, transparency trail, quiet-engine honesty, and finalize verbs live on architecture-nested findings.",
  },
  {
    id: "inspector",
    title: "Review-detail is an inspector",
    body: "Open the nested review when you need package or timeline context. Back returns to the architecture desk or nested findings.",
  },
  {
    id: "doors",
    title: `${WORKING_CAREER_DOOR_LABEL} vs ${WORKING_REHEARSAL_DOOR_LABEL}`,
    body: `${WORKING_CAREER_DOOR_LABEL} is production proof path. ${WORKING_REHEARSAL_DOOR_LABEL} stays rehearsal-stamped — start chrome names that before spawn.`,
  },
] as const;

export const INHABIT_THE_ARCHITECTURE_HELP_PRIMARY_ACTION = {
  label: "Open architecture desk help",
  href: inAppHelpHref("architecture-desk"),
} as const;

export const INHABIT_THE_ARCHITECTURE_HELP_SECONDARY_ACTIONS = [
  {
    label: "Record and Practice doors",
    href: inAppHelpHref("career-rehearsal-doors"),
  },
  {
    label: "System gravity (instrument vs inhabit)",
    href: inAppHelpHref("system-gravity"),
  },
] as const;
