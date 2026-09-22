/** CE-020 / EIM — help: impact preview vs architecture sketch envelope (SN-007 / ADR 0092). */
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { CHEAP_EXPLORATION_ADR_0092_RELATIVE_PATH } from "@/lib/cheap-exploration-adr-inventory";
import { CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PATH } from "@/lib/cheap-exploration-help-sketch-a-change-route";
import {
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_HEADING_ID,
} from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-evidence-copy";
import { CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PATH } from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-route";
import { HELP_HUB_CANONICAL_PATH } from "@/lib/help/help-hub-evidence-copy";
import {
  WORKING_CAREER_DOOR_LABEL,
  WORKING_REHEARSAL_DOOR_LABEL,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import { IMPACT_PREVIEW_CANONICAL_PATH } from "@/lib/impact-preview-evidence-copy";
import { IMPACT_PREVIEW_HELP_CANONICAL_PATH } from "@/lib/impact-preview-help-evidence-copy";
import { MODE_GRAVITY_HELP_WHICH_MODE_PATH } from "@/lib/mode-gravity-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_HEADING,
} from "@/lib/system-not-job-impact-preview-envelope-entry";

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SLUG =
  "impact-preview-vs-architecture-envelope" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TITLE =
  "Impact preview vs architecture envelope" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PAGE_SUBTITLE =
  "Working help — compare policy cheap envelope vs architecture desk sketch. See technical mapping for governing identifiers." as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW_LEAD =
  "Working seats expose two cheap envelopes on the architecture desk. Pick Impact preview when you need policy what-if on a finalized baseline; pick Sketch a change when you need the next editable architecture draft from the sealed snapshot." as const;

/** @deprecated Use {@link CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW_LEAD} — kept for drift guards. */
export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW =
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW_LEAD;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SECURENOW_APPLICABILITY_TAG =
  "Architecture only" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_NOTE_TITLE =
  SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_HEADING;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_NOTE_BODY =
  "Cheap envelopes are review-time analysis on the architecture desk — neither path observes production systems, substitutes for runtime validation, or counts as a sealed review record export by itself." as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_STATUS_CHIP =
  "Policy analysis" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_APPLICABILITY_WORKING =
  "Working Architecture seats show nested Impact preview under the architecture desk and Sketch a change after spawn lock — the desk lock that keeps nested reviews on the current architecture object. Both stay on the desk — not peer products from the reviews hub home." as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_APPLICABILITY_GUIDED =
  "Guided, demo, and trial seats may teach two-path onboarding with sample scope. Switch to Working when you need nested policy preview and labeled clone sketch on the paying desk." as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_APPLICABILITY_SECURENOW =
  "The SecureNow (Security) product shell does not host Architecture Working cheap envelopes — this topic applies to Architecture review workflows and in-app Architecture help routes only." as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RECORD_PRACTICE_HEADING =
  "Record vs Practice on cheap envelopes" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RECORD_PRACTICE_BODY =
  `Sketch a change stays ${WORKING_REHEARSAL_DOOR_LABEL.toLowerCase()}-stamped (stored token rehearsal) until you explicitly execute a ${WORKING_CAREER_DOOR_LABEL} review. Impact preview is policy analysis on a finalized baseline — it does not flip review type by itself. When desk gravity is unclear, read Which mode am I in? before you brief sponsors.` as const;

export type CheapExplorationHelpImpactPreviewVsEnvelopeComparisonRow = {
  readonly aspect: string;
  readonly impactPreview: string;
  readonly sketchAChange: string;
};

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_COMPARISON_ROWS: readonly CheapExplorationHelpImpactPreviewVsEnvelopeComparisonRow[] =
  [
    {
      aspect: "Purpose",
      impactPreview:
        "Policy cheap envelope — a bounded what-if that re-simulates policy packs and recorded findings on a proposed change.",
      sketchAChange:
        "Architecture sketch envelope — a bounded clone from the sealed snapshot into the next editable architecture draft.",
    },
    {
      aspect: "Desk entry",
      impactPreview: "Nested Impact preview under the architecture desk.",
      sketchAChange: "Sketch a change after spawn lock on the current architecture draft.",
    },
    {
      aspect: "Review type stamp",
      impactPreview: "Policy analysis — not a review-type chooser flip.",
      sketchAChange: `${WORKING_REHEARSAL_DOOR_LABEL} until you execute ${WORKING_CAREER_DOOR_LABEL} (career / rehearsal tokens unchanged).`,
    },
    {
      aspect: "Compare use",
      impactPreview: "Neither path is draft-to-draft Compare.",
      sketchAChange: "Neither path is draft-to-draft Compare.",
    },
    {
      aspect: "Sponsor proof",
      impactPreview: "Orient before sponsor brief — not procurement proof alone.",
      sketchAChange: `${WORKING_REHEARSAL_DOOR_LABEL} labeling on sketches — not sealed-record proof until Record finalize.`,
    },
  ] as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_COMPARE_USE_FOOTNOTE =
  "Sealed-record pairwise Compare still needs two finalized sealed review records — see technical mapping for R12." as const;

export type CheapExplorationHelpImpactPreviewVsEnvelopeOpenWorkspacePath = {
  readonly label: string;
  readonly helpHref: string;
  readonly workspaceHref: string;
  readonly workspaceLinkLabel: string;
  readonly secureNowWorkspaceLinkLabel: string;
  readonly detail: string;
};

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OPEN_WORKSPACE_PATHS: readonly CheapExplorationHelpImpactPreviewVsEnvelopeOpenWorkspacePath[] =
  [
    {
      label: "Impact preview",
      helpHref: IMPACT_PREVIEW_HELP_CANONICAL_PATH,
      workspaceHref: IMPACT_PREVIEW_CANONICAL_PATH,
      workspaceLinkLabel: "Open impact preview",
      secureNowWorkspaceLinkLabel: "Architecture product · Open impact preview",
      detail: "Policy cheap envelope — simulate pack and finding impact before you treat output as sealed-record proof.",
    },
    {
      label: "Sketch a change",
      helpHref: CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PATH,
      workspaceHref: REVIEWS_LIST_PATH,
      workspaceLinkLabel: "Open architecture reviews",
      secureNowWorkspaceLinkLabel: "Architecture product · Open architecture reviews",
      detail: "Architecture sketch envelope — labeled clone from snapshot on the desk, not nested policy preview.",
    },
  ] as const;

/** @deprecated Folded into {@link CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OPEN_WORKSPACE_PATHS}. */
export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CONTRASTED_PATHS =
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OPEN_WORKSPACE_PATHS;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_MODE_RELATION_HEADING =
  "Workspace mode and desk gravity" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_MODE_RELATION_BODY =
  "Cheap envelopes assume Working desk gravity after spawn lock — nested reviews stay inspectors on the architecture object, not a second home product. Guided teaching chrome may hide desk CTAs until you switch modes; read Which mode am I in? when gravity is unclear." as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TECHNICAL_MAPPING_HEADING_ID =
  "help-impact-preview-vs-envelope-technical-mapping" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TECHNICAL_MAPPING_HEADING =
  "Technical mapping and ADRs" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TECHNICAL_MAPPING_INTRO =
  "Stored review-type tokens stay career and rehearsal while the UI shows Record and Practice on the Working desk." as const;

export type CheapExplorationHelpImpactPreviewVsEnvelopeTechnicalIdentifier = {
  readonly id: string;
  readonly definition: string;
};

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TECHNICAL_IDENTIFIERS: readonly CheapExplorationHelpImpactPreviewVsEnvelopeTechnicalIdentifier[] =
  [
    {
      id: "CE-020",
      definition: "Cheap-exploration help inventory owner for this impact preview vs architecture envelope topic.",
    },
    {
      id: "SN-007",
      definition: "Nested Impact preview entry under the architecture desk policy cheap envelope.",
    },
    {
      id: "R12",
      definition:
        "Compare proof still needs two finalized sealed review records — cheap envelopes explore policy impact or open the next sketch; they do not replace Compare two reviews or unseal a parent snapshot.",
    },
  ] as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_ADR_0092_IN_APP_HREF =
  inAppHelpHref("sketch-a-change");

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_ADR_0092_IN_APP_LABEL = "ADR 0092" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_ADR_REFERENCES = [
  {
    id: "0092",
    path: CHEAP_EXPLORATION_ADR_0092_RELATIVE_PATH,
    inAppHref: CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_ADR_0092_IN_APP_HREF,
    inAppLabel: CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_ADR_0092_IN_APP_LABEL,
  },
] as const;

/** @deprecated R12 moved to {@link CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TECHNICAL_IDENTIFIERS}. */
export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_R12_HEADING =
  "R12 and sealed-record Compare" as const;

/** @deprecated R12 moved to {@link CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TECHNICAL_IDENTIFIERS}. */
export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_R12_BODY =
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TECHNICAL_IDENTIFIERS.find((row) => row.id === "R12")
    ?.definition ?? "";

export type CheapExplorationHelpImpactPreviewVsEnvelopeRelatedLink = {
  readonly label: string;
  readonly href: string;
  readonly description?: string;
};

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_TOPICS_HEADING_ID =
  "help-impact-preview-vs-envelope-related-topics" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_TOPICS_HEADING = "Related" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_LINKS: readonly CheapExplorationHelpImpactPreviewVsEnvelopeRelatedLink[] =
  [
    {
      label: "Impact preview",
      href: inAppHelpHref("impact-preview"),
      description: "Policy cheap envelope orientation before you open the live desk entry.",
    },
    {
      label: "Sketch a change",
      href: inAppHelpHref("sketch-a-change"),
      description: "Architecture sketch envelope after spawn lock on the paying desk.",
    },
    {
      label: "Architecture desk — system, not job",
      href: inAppHelpHref("architecture-desk"),
      description: "Desk object gravity for nested reviews and cheap envelopes.",
    },
    {
      label: "Which mode am I in?",
      href: MODE_GRAVITY_HELP_WHICH_MODE_PATH,
      description: "Resolve Working vs Guided chrome before you pick an envelope entry.",
    },
    {
      label: "Record vs Practice on the Working desk",
      href: inAppHelpHref("career-vs-rehearsal"),
    },
    {
      label: "Compare two reviews",
      href: inAppHelpHref("comparison-replay"),
      description: "Sealed-record pairwise diff — not draft-to-draft cheap envelopes.",
    },
    {
      label: "Architecture reviews",
      href: REVIEWS_LIST_PATH,
      description: "Open a package desk before you treat help copy as live proof.",
    },
    {
      label: "Security & Trust",
      href: inAppHelpHref("security-trust"),
    },
    {
      label: "Help index",
      href: HELP_HUB_CANONICAL_PATH,
    },
  ] as const;

/** @deprecated Merged into {@link CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_LINKS}. */
export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_TOPICS =
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_LINKS;

/** @deprecated Merged into {@link CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_LINKS}. */
export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SOURCES =
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_LINKS;

/** @deprecated Folded into breadcrumb — no footer Help index link. */
export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_HELP_RETURN = {
  label: "Help & Support",
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TOC_JUMP_HINT =
  "Use Ctrl+K to jump to any page from the command palette." as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "help-impact-preview-vs-envelope-comparison", title: "Impact preview vs Sketch a change" },
  {
    level: 2,
    id: CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_HEADING_ID,
    title: CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_NOTE_TITLE,
  },
  { level: 2, id: "help-impact-preview-vs-envelope-applicability", title: "Scope and seat applicability" },
  {
    level: 2,
    id: "help-impact-preview-vs-envelope-record-practice",
    title: CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RECORD_PRACTICE_HEADING,
  },
  {
    level: 2,
    id: "help-impact-preview-vs-envelope-mode-relation",
    title: CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_MODE_RELATION_HEADING,
  },
  {
    level: 2,
    id: CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TECHNICAL_MAPPING_HEADING_ID,
    title: CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TECHNICAL_MAPPING_HEADING,
  },
  {
    level: 2,
    id: CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_TOPICS_HEADING_ID,
    title: CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_TOPICS_HEADING,
  },
] as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CANONICAL_PATH =
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PATH;

/** Drift guard — overview stays positive-only; header claim owns production negation once. */
export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_NEGATION_DRIFT_MARKERS = {
  overviewMustNotContain: ["does not observe", "not production observation", "Sources package", "signed packages"],
  claimMustContain: "observes production",
} as const;

/** Drift guard — in-app help must not deep-link GitHub blob URLs. */
export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_FORBIDDEN_LINK_MARKERS = [
  "github.com",
  "/blob/",
] as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_ALIASES = [
  "policy cheap envelope",
  "architecture sketch envelope",
  "impact preview vs sketch",
  "cheap envelope compare",
  "architecture envelope",
  "sn-007",
  "ce-020",
  "r12 compare",
  "career rehearsal envelope",
  "spawn lock",
] as const;
