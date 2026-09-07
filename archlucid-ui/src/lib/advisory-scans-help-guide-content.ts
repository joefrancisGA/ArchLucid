import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  ADVISORY_SCANS_BASELINE_REVIEW_HELPER,
  ADVISORY_SCANS_CARD_DISPOSITION_LABEL,
  ADVISORY_SCANS_CARD_EVIDENCE_LABEL,
  ADVISORY_SCANS_CARD_IMPACT_LABEL,
  ADVISORY_SCANS_CARD_OWNER_LABEL,
  ADVISORY_SCANS_CARD_RELATED_FINDING_LABEL,
  ADVISORY_SCANS_CARD_SUGGESTED_ACTION_LABEL,
  ADVISORY_SCANS_DISPOSITION_ACCEPT,
  ADVISORY_SCANS_DISPOSITION_ACCEPT_HINT,
  ADVISORY_SCANS_DISPOSITION_DEFER,
  ADVISORY_SCANS_DISPOSITION_DEFER_HINT,
  ADVISORY_SCANS_DISPOSITION_IMPLEMENTED,
  ADVISORY_SCANS_DISPOSITION_IMPLEMENTED_HINT,
  ADVISORY_SCANS_DISPOSITION_REJECT,
  ADVISORY_SCANS_DISPOSITION_REJECT_HINT,
  ADVISORY_SCANS_INLINE_CAPABILITY_BOUNDARY,
  ADVISORY_SCANS_SAMPLE_ANCHOR_HREF,
  ADVISORY_SCANS_SUMMARY_ACCEPTED,
  ADVISORY_SCANS_SUMMARY_COMPARED_TO,
  ADVISORY_SCANS_SUMMARY_DEFERRED,
  ADVISORY_SCANS_SUMMARY_HIGH_IMPACT,
  ADVISORY_SCANS_SUMMARY_IMPLEMENTED,
  ADVISORY_SCANS_SUMMARY_LAST_SCAN,
  ADVISORY_SCANS_SUMMARY_RECOMMENDATIONS_GENERATED,
  ADVISORY_SCANS_SUMMARY_REJECTED,
  ADVISORY_SCANS_SUMMARY_SECTION_TITLE,
} from "@/lib/advisory-copy";
import { ADVISORY_SCANS_CANONICAL_PATH } from "@/lib/advisory-scans-evidence-copy";
import { ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/advisory-scans-help-evidence-copy";
import { ADVISORY_SCANS_HELP_TOPIC_LABEL } from "@/lib/advisory-scans-help-evidence-copy";
import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { DIGESTS_SUBSCRIPTIONS_TAB_PATH } from "@/lib/digests-route-paths";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ADVISORY_SCANS_HELP_PAGE_EYEBROW = "Help topic · Governance" as const;

export const ADVISORY_SCANS_HELP_PAGE_TITLE = "Advisory scans";

export const ADVISORY_SCANS_HELP_PAGE_SUBTITLE =
  "Generate prioritized follow-up recommendations from finalized architecture reviews.";

export const ADVISORY_SCANS_HELP_OVERVIEW =
  "Each recommendation includes impact level, evidence basis, suggested action, and resolve status so owners can triage follow-up in one place.";

export const ADVISORY_SCANS_HELP_START_HERE_ROLE_LINK = {
  label: "execute access or a management role",
  href: inAppHelpHref("users-and-roles"),
} as const;

/** Help Start here card — schedule mutation honesty; not the hub tab screen-reader constant. */
export const ADVISORY_SCANS_HELP_START_HERE_SCOPE_NOTE_LEAD =
  "View schedules and prior scan results here; creating schedules and generating scans requires ";

export const ADVISORY_SCANS_HELP_START_HERE_SCOPE_NOTE_TAIL = ".";

export const ADVISORY_SCANS_HELP_START_HERE_SCOPE_NOTE = `${ADVISORY_SCANS_HELP_START_HERE_SCOPE_NOTE_LEAD}${ADVISORY_SCANS_HELP_START_HERE_ROLE_LINK.label}${ADVISORY_SCANS_HELP_START_HERE_SCOPE_NOTE_TAIL}`;

/** Hub screen-reader hint on Schedules tab when the caller cannot mutate advisory schedules. */
export const ADVISORY_SCANS_HUB_READER_ROLE_PRECONDITION = `View schedules and prior scan results; creating schedules and generating scans requires ${ADVISORY_SCANS_HELP_START_HERE_ROLE_LINK.label}.`;

export const ADVISORY_SCANS_HELP_START_HERE_CARD_TITLE = "Start here";

export const ADVISORY_SCANS_HELP_START_HERE_HEADING_ID = "start-here" as const;

export const ADVISORY_SCANS_HELP_BEFORE_YOU_START_TITLE = "Before you start";

export const ADVISORY_SCANS_HELP_BEFORE_YOU_START_HEADING_ID = "before-you-start" as const;

export const ADVISORY_SCANS_HELP_BEFORE_YOU_START_BODY =
  "Advisory scans require at least one finalized architecture review in scope. Optionally choose a baseline review for comparison so the scan highlights drift since an earlier package.";

export const ADVISORY_SCANS_HELP_SAMPLE_RECOMMENDATION_LINK = {
  label: "View sample advisory recommendation",
  href: `${ADVISORY_SCANS_CANONICAL_PATH}${ADVISORY_SCANS_SAMPLE_ANCHOR_HREF}`,
} as const;

export const ADVISORY_SCANS_HELP_FINALIZE_REVIEW_LINK = {
  label: "Finalize an architecture review",
  href: "/architecture/reviews",
} as const;

export const ADVISORY_SCANS_HELP_PRIMARY_ACTION = {
  label: "Open advisory scans",
  href: ADVISORY_SCANS_CANONICAL_PATH,
} as const;

export type AdvisoryScansHelpOutputField = {
  readonly label: string;
  readonly detail: string;
};

/** Card field labels — imported from advisory-copy so help stays aligned with the hub card. */
export const ADVISORY_SCANS_HELP_CARD_FIELD_LABELS = [
  ADVISORY_SCANS_CARD_IMPACT_LABEL,
  ADVISORY_SCANS_CARD_RELATED_FINDING_LABEL,
  ADVISORY_SCANS_CARD_EVIDENCE_LABEL,
  ADVISORY_SCANS_CARD_SUGGESTED_ACTION_LABEL,
  ADVISORY_SCANS_CARD_OWNER_LABEL,
  ADVISORY_SCANS_CARD_DISPOSITION_LABEL,
] as const;

export const ADVISORY_SCANS_HELP_OUTPUT_FIELDS: readonly AdvisoryScansHelpOutputField[] = [
  {
    label: ADVISORY_SCANS_CARD_IMPACT_LABEL,
    detail: "Impact or urgency label that ranks the recommendation for triage.",
  },
  {
    label: ADVISORY_SCANS_CARD_RELATED_FINDING_LABEL,
    detail: "Governance finding or risk the recommendation addresses.",
  },
  {
    label: ADVISORY_SCANS_CARD_EVIDENCE_LABEL,
    detail: "Evidence basis and rationale cites supporting the recommendation.",
  },
  {
    label: ADVISORY_SCANS_CARD_SUGGESTED_ACTION_LABEL,
    detail: "Concrete follow-up action the scan suggests for owners.",
  },
  {
    label: ADVISORY_SCANS_CARD_OWNER_LABEL,
    detail: "Owner or role accountable for disposition and follow-up.",
  },
  {
    label: ADVISORY_SCANS_CARD_DISPOSITION_LABEL,
    detail: "Recorded Accept, Defer, Reject, or Mark implemented status for approval.",
  },
] as const;

export type AdvisoryScansHelpSummaryMetric = {
  readonly label: string;
  readonly detail: string;
};

/** Scan summary metric labels — imported from advisory-copy for hub parity. */
export const ADVISORY_SCANS_HELP_SUMMARY_METRIC_LABELS = [
  ADVISORY_SCANS_SUMMARY_RECOMMENDATIONS_GENERATED,
  ADVISORY_SCANS_SUMMARY_HIGH_IMPACT,
  ADVISORY_SCANS_SUMMARY_ACCEPTED,
  ADVISORY_SCANS_SUMMARY_DEFERRED,
  ADVISORY_SCANS_SUMMARY_REJECTED,
  ADVISORY_SCANS_SUMMARY_IMPLEMENTED,
  ADVISORY_SCANS_SUMMARY_LAST_SCAN,
  ADVISORY_SCANS_SUMMARY_COMPARED_TO,
] as const;

export const ADVISORY_SCANS_HELP_SUMMARY_METRICS: readonly AdvisoryScansHelpSummaryMetric[] = [
  {
    label: ADVISORY_SCANS_SUMMARY_RECOMMENDATIONS_GENERATED,
    detail: "Count of recommendations produced by the latest scan in scope.",
  },
  {
    label: ADVISORY_SCANS_SUMMARY_HIGH_IMPACT,
    detail: "Recommendations flagged as high impact for priority triage.",
  },
  {
    label: ADVISORY_SCANS_SUMMARY_ACCEPTED,
    detail: "Recommendations accepted into approval follow-up.",
  },
  {
    label: ADVISORY_SCANS_SUMMARY_DEFERRED,
    detail: "Recommendations deferred for later review.",
  },
  {
    label: ADVISORY_SCANS_SUMMARY_REJECTED,
    detail: "Recommendations rejected with recorded rationale.",
  },
  {
    label: ADVISORY_SCANS_SUMMARY_IMPLEMENTED,
    detail: "Recommendations marked implemented after completion.",
  },
  {
    label: ADVISORY_SCANS_SUMMARY_LAST_SCAN,
    detail: "Timestamp of the most recent scan load for the selected review scope.",
  },
  {
    label: ADVISORY_SCANS_SUMMARY_COMPARED_TO,
    detail: "Baseline review used when comparison signals were included in the scan.",
  },
] as const;

export const ADVISORY_SCANS_HELP_SUMMARY_SECTION_TITLE = ADVISORY_SCANS_SUMMARY_SECTION_TITLE;

export const ADVISORY_SCANS_HELP_DISPOSITION_SECTION_TITLE = "Record a disposition";

export const ADVISORY_SCANS_HELP_DISPOSITION_HEADING_ID = "record-a-disposition" as const;

export type AdvisoryScansHelpDispositionAction = {
  readonly label: string;
  readonly hint: string;
};

/** Disposition actions — label/hint pairs sourced from advisory-copy (parity with hub card). */
export const ADVISORY_SCANS_HELP_DISPOSITION_ACTIONS: readonly AdvisoryScansHelpDispositionAction[] = [
  { label: ADVISORY_SCANS_DISPOSITION_ACCEPT, hint: ADVISORY_SCANS_DISPOSITION_ACCEPT_HINT },
  { label: ADVISORY_SCANS_DISPOSITION_DEFER, hint: ADVISORY_SCANS_DISPOSITION_DEFER_HINT },
  { label: ADVISORY_SCANS_DISPOSITION_REJECT, hint: ADVISORY_SCANS_DISPOSITION_REJECT_HINT },
  { label: ADVISORY_SCANS_DISPOSITION_IMPLEMENTED, hint: ADVISORY_SCANS_DISPOSITION_IMPLEMENTED_HINT },
] as const;

export const ADVISORY_SCANS_HELP_DISPOSITION_AUDIT_NOTE =
  "Optional comments and rationale persist with each resolve outcome for audit and follow-up.";

export const ADVISORY_SCANS_HELP_HOW_DERIVATION_SENTENCE =
  "Recommendations come from review findings, evidence, policy rules, and optional comparison signals.";

export const ADVISORY_SCANS_HELP_AI_USAGE_DISCLOSURE_LEAD =
  "Scan generation runs asynchronously (tier B — typically seconds to a few minutes). Monitor estimated AI spend on the";

export const ADVISORY_SCANS_HELP_AI_USAGE_DISCLOSURE_TAIL = " when scan generation adds model activity.";

export const ADVISORY_SCANS_HELP_WHAT_SHOWS_HEADING_ID = "what-advisory-scans-show" as const;

export const ADVISORY_SCANS_HELP_WHAT_SHOWS_SECTION_TITLE = "What advisory scans show" as const;

export const ADVISORY_SCANS_HELP_HOW_SECTION_HEADING_ID = "how-advisory-scans-work" as const;

export type AdvisoryScansHelpTroubleshootingItem = {
  readonly issue: string;
  readonly resolution: string;
  readonly href?: string;
  readonly linkLabel?: string;
};

export const ADVISORY_SCANS_HELP_TROUBLESHOOTING_TITLE = "If something looks wrong";

export const ADVISORY_SCANS_HELP_TROUBLESHOOTING_HEADING_ID = "if-something-looks-wrong" as const;

export const ADVISORY_SCANS_HELP_TROUBLESHOOTING: readonly AdvisoryScansHelpTroubleshootingItem[] = [
  {
    issue: "Generate scan is unavailable",
    resolution:
      "Confirm at least one architecture review is finalized in scope and your role includes execute access or a management role for schedule mutations.",
  },
  {
    issue: "Recommendations look empty or stale",
    resolution:
      "Reload the advisory scans hub and verify the latest scan completed. Check the last scan timestamp in the summary metrics.",
  },
  {
    issue: "Disposition controls are missing",
    resolution: "Readers can view recommendations but cannot record dispositions without execute access. Confirm role permissions on",
    href: inAppHelpHref("users-and-roles"),
    linkLabel: "users and roles help",
  },
  {
    issue: "Schedules tab shows no cadence",
    resolution:
      "Open the Schedules tab after confirming execute access. Create or enable a recurring schedule when scans should run automatically.",
  },
  {
    issue: "Baseline comparison is missing",
    resolution:
      "Baseline review selection is optional. Choose a finalized baseline review when the scan should highlight drift since an earlier package.",
  },
] as const;

export const ADVISORY_SCANS_HELP_AI_USAGE_LINK = {
  label: "AI usage help",
  href: inAppHelpHref("ai-usage"),
} as const;

export const ADVISORY_SCANS_HELP_RELATED_GOVERNANCE_SURFACES_HEADING_ID = "related-governance-surfaces" as const;

export const ADVISORY_SCANS_HELP_RELATED_GOVERNANCE_SURFACES_TITLE = "Related approval surfaces" as const;

export type AdvisoryScansHelpTileItem = {
  readonly label: string;
  readonly detail: string;
  readonly href: string;
};

export const ADVISORY_SCANS_HELP_TILE_ITEMS: readonly AdvisoryScansHelpTileItem[] = [
  {
    label: "Schedules",
    detail: "Open the Schedules tab when recurring advisory scans should run on a cadence.",
    href: ADVISORY_SCANS_SCHEDULES_HREF,
  },
  {
    label: "Audit trail",
    detail: "Open audit when a recommendation needs a formal assurance trail with persisted cites.",
    href: GOVERNANCE_AUDIT_PATH,
  },
  {
    label: "Findings triage",
    detail: "Follow linked findings when a scan surfaces material architecture concerns.",
    href: GOVERNANCE_FINDINGS_PATH,
  },
  {
    label: "Architecture digests",
    detail: "Digest subscriptions can include advisory scan summaries when configured.",
    href: DIGESTS_SUBSCRIPTIONS_TAB_PATH,
  },
] as const;

export type AdvisoryScansHelpHowToReadStepPart =
  | { readonly type: "text"; readonly value: string }
  | { readonly type: "link"; readonly label: string; readonly href: string };

export type AdvisoryScansHelpHowToReadStep = {
  readonly parts: readonly AdvisoryScansHelpHowToReadStepPart[];
};

export const ADVISORY_SCANS_HELP_HOW_TO_READ_STEPS: readonly AdvisoryScansHelpHowToReadStep[] = [
  {
    parts: [
      { type: "text", value: "Finalize " },
      {
        type: "link",
        label: ADVISORY_SCANS_HELP_FINALIZE_REVIEW_LINK.label,
        href: ADVISORY_SCANS_HELP_FINALIZE_REVIEW_LINK.href,
      },
      { type: "text", value: " that should drive follow-up recommendations." },
    ],
  },
  {
    parts: [
      { type: "text", value: "Generate a scan or configure a schedule on the " },
      { type: "link", label: "Schedules tab", href: ADVISORY_SCANS_SCHEDULES_HREF },
      { type: "text", value: "." },
    ],
  },
  {
    parts: [{ type: "text", value: "Record a resolve outcome on each recommendation to feed audit and follow-up workflows." }],
  },
] as const;

export const ADVISORY_SCANS_HELP_BASELINE_COMPARISON_NOTE = ADVISORY_SCANS_BASELINE_REVIEW_HELPER;

export const ADVISORY_SCANS_HELP_CLAIM_HEADING_ID = "what-advisory-scans-are-not" as const;

export const ADVISORY_SCANS_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  {
    level: 2,
    id: ADVISORY_SCANS_HELP_CLAIM_HEADING_ID,
    title: ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: ADVISORY_SCANS_HELP_START_HERE_HEADING_ID, title: ADVISORY_SCANS_HELP_START_HERE_CARD_TITLE },
  { level: 2, id: ADVISORY_SCANS_HELP_BEFORE_YOU_START_HEADING_ID, title: ADVISORY_SCANS_HELP_BEFORE_YOU_START_TITLE },
  { level: 2, id: ADVISORY_SCANS_HELP_WHAT_SHOWS_HEADING_ID, title: ADVISORY_SCANS_HELP_WHAT_SHOWS_SECTION_TITLE },
  { level: 2, id: ADVISORY_SCANS_HELP_DISPOSITION_HEADING_ID, title: ADVISORY_SCANS_HELP_DISPOSITION_SECTION_TITLE },
  {
    level: 2,
    id: ADVISORY_SCANS_HELP_RELATED_GOVERNANCE_SURFACES_HEADING_ID,
    title: ADVISORY_SCANS_HELP_RELATED_GOVERNANCE_SURFACES_TITLE,
  },
  { level: 2, id: ADVISORY_SCANS_HELP_HOW_SECTION_HEADING_ID, title: ADVISORY_SCANS_HELP_TOPIC_LABEL },
  { level: 2, id: ADVISORY_SCANS_HELP_TROUBLESHOOTING_HEADING_ID, title: ADVISORY_SCANS_HELP_TROUBLESHOOTING_TITLE },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard: overview stays positive-only; claim band owns capability boundaries once. */
export const ADVISORY_SCANS_HELP_NEGATION_DRIFT_MARKERS = {
  overviewMustNotContain: [
    "not a sealed review record",
    "approval",
    "automatic remediation",
    "not a full audit export",
    "Sources package",
    "sources package",
  ],
  claimMustContain: ADVISORY_SCANS_INLINE_CAPABILITY_BOUNDARY,
} as const;
