/** SN-032 — Working help: architecture identity is the object; review is a nested job (WS-20 / ADR 0079). */
import {
  ARCHITECTURES_LIST_PATH,
  ARCHITECTURES_NEW_PATH,
  REVIEWS_LIST_PATH,
} from "@/lib/architecture/architecture-routes";
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { WORKING_REVIEWS_INBOX_NAV_LABEL } from "@/lib/operator/operator-nav-labels";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DESK_CTA_LABEL } from "@/lib/system-not-job-clone-from-snapshot-entry";
import {
  SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_INBOX_CAPTION,
} from "@/lib/system-not-job-reviews-hub-inbox-copy";
import {
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PATH,
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_SLUG,
  SYSTEM_NOT_JOB_HELP_GUIDED_NOTE_HEADING_ID,
} from "@/lib/system-not-job-help-system-not-job-route";

export const SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PAGE_TITLE = "Architecture desk — system, not job";

export const SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PAGE_SUBTITLE =
  "Working help for named architectures, nested review jobs, and inbox triage — one desk object, not peer start forks.";

export const SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_OVERVIEW =
  "On Working seats, the named architecture is your durable object. Drafts and reviews are jobs on that desk — not peer products you pick from a flat evaluator list. Open Architectures to resume Monday-morning work; use Inbox only when you need cross-architecture triage.";

export type SystemNotJobHelpArchitectureDeskConceptTile = {
  readonly id: "identity" | "nested-jobs" | "inbox-secondary" | "clone-after-spawn";
  readonly title: string;
  readonly body: string;
};

export const SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_CONCEPT_TILES: readonly SystemNotJobHelpArchitectureDeskConceptTile[] =
  [
    {
      id: "identity",
      title: "Architecture identity is the object",
      body:
        "Each named system under Architectures is the durable parent. Portfolio lists open drafts; the desk shows current draft, child reviews, sealed versions, and desk tools bound to that identity.",
    },
    {
      id: "nested-jobs",
      title: "Reviews are nested jobs",
      body:
        "Start review from the architecture desk — not from a second create product. Child review rows open under the nested desk URL. Activity and inbox surfaces are meta; findings and decisions stay on the system.",
    },
    {
      id: "inbox-secondary",
      title: `${WORKING_REVIEWS_INBOX_NAV_LABEL} is secondary`,
      body: SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_INBOX_CAPTION,
    },
    {
      id: "clone-after-spawn",
      title: `${SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DESK_CTA_LABEL} after spawn lock`,
      body:
        "When a draft spawns a linked review, the parent snapshot stays sealed. Use Sketch a change on the desk to open the next editable draft under the same architecture — the legal successor, not a second desk product.",
    },
  ] as const;

export const SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_GUIDED_NOTE =
  "Guided workspace mode may still teach two-path onboarding (for example first-review guide and sample walkthrough). Working mode does not fork create architecture vs start review as peer top-level products — one start path from the desk.";

/** Copy guard — Working architecture-desk help must not re-teach evaluator two-start IA. */
export const SYSTEM_NOT_JOB_HELP_WORKING_TWO_START_PRODUCT_MARKERS =
  /two start products|create architecture.{0,40}start review.{0,40}peer|evaluator ia/i;

export const SYSTEM_NOT_JOB_HELP_WORKING_AUTHORITY_PIPELINE_MARKERS = /authority pipeline/i;

export const SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PRIMARY_ACTION = {
  label: "Open architectures",
  href: ARCHITECTURES_LIST_PATH,
} as const;

export const SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_SECONDARY_ACTIONS = [
  {
    label: WORKING_REVIEWS_INBOX_NAV_LABEL,
    href: REVIEWS_LIST_PATH,
  },
  {
    label: "Getting started",
    href: inAppHelpHref("getting-started"),
  },
  {
    label: "Record and Practice",
    href: inAppHelpHref("career-rehearsal-doors"),
  },
] as const;

export const SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "monday-object", title: "What is the Monday object?" },
  { level: 2, id: "nested-jobs", title: "Reviews as nested jobs" },
  { level: 2, id: "inbox-triage", title: `${WORKING_REVIEWS_INBOX_NAV_LABEL} triage` },
  { level: 2, id: "clone-spawn", title: "Clone after spawn lock" },
  {
    level: 2,
    id: SYSTEM_NOT_JOB_HELP_GUIDED_NOTE_HEADING_ID,
    title: "Guided vs Working",
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

export const SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_CANONICAL_HANDOFF_MARKERS = [
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PATH,
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_SLUG,
  "SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PATH",
] as const;

export function resolveSystemNotJobHelpArchitectureDeskNewReviewHref(): string {
  return ARCHITECTURES_NEW_PATH;
}
