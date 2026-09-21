/** CE-020 / EIM — help: impact preview vs architecture sketch envelope (SN-007 / ADR 0092). */
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { CHEAP_EXPLORATION_ADR_0092_RELATIVE_PATH } from "@/lib/cheap-exploration-adr-inventory";
import { CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PATH } from "@/lib/cheap-exploration-help-sketch-a-change-route";
import {
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_HEADING_ID,
} from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-evidence-copy";
import { CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PATH } from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-route";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import {
  WORKING_CAREER_DOOR_LABEL,
  WORKING_REHEARSAL_DOOR_LABEL,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import { IMPACT_PREVIEW_CANONICAL_PATH } from "@/lib/impact-preview-evidence-copy";
import { IMPACT_PREVIEW_HELP_CANONICAL_PATH } from "@/lib/impact-preview-help-evidence-copy";
import { MODE_GRAVITY_HELP_WHICH_MODE_PATH } from "@/lib/mode-gravity-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_BODY,
  SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_HEADING,
  SYSTEM_NOT_JOB_IMPACT_PREVIEW_PRODUCTION_DISCLAIMER,
} from "@/lib/system-not-job-impact-preview-envelope-entry";

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SLUG =
  "impact-preview-vs-architecture-envelope" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TITLE =
  "Impact preview vs architecture envelope" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PAGE_SUBTITLE =
  "Working help — policy cheap envelope vs architecture desk sketch (CE-020 / SN-007 / ADR 0092)." as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW_LEAD =
  "Working seats expose two labeled cheap envelopes on the architecture desk. Policy cheap envelope (Impact preview) re-simulates policy packs on a finalized baseline. Sketch a change clones from the sealed snapshot into the next editable architecture draft. Pick the entry that matches whether you need policy what-if or the next architecture sketch." as const;

/** @deprecated Use {@link CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW_LEAD} — kept for drift guards. */
export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW =
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW_LEAD;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_NOTE_TITLE =
  SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_HEADING;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_NOTE_BODY =
  `${SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_BODY} ${SYSTEM_NOT_JOB_IMPACT_PREVIEW_PRODUCTION_DISCLAIMER}` as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_STATUS_TAG =
  "Review-time analysis" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_APPLICABILITY_WORKING =
  "Working Architecture seats show nested Impact preview under the architecture desk and Sketch a change after spawn lock. Both stay on the desk object — not peer products from the reviews hub home." as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_APPLICABILITY_GUIDED =
  "Guided, demo, and trial seats may teach two-path onboarding with sample scope. Switch to Working when you need nested policy preview and labeled clone sketch on the paying desk." as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_APPLICABILITY_SECURENOW =
  "The SecureNow (Security) product shell does not host Architecture Working cheap envelopes — this topic applies to Architecture review workflows and in-app Architecture help routes only." as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RECORD_PRACTICE_HEADING =
  "Record vs Practice on cheap envelopes" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RECORD_PRACTICE_BODY =
  `Sketch a change stays ${WORKING_REHEARSAL_DOOR_LABEL.toLowerCase()}-stamped (stored token rehearsal) until you explicitly execute a ${WORKING_CAREER_DOOR_LABEL} review. Impact preview is policy analysis on a finalized baseline — it does not flip review type by itself. Host Mode and workspace mode stay honest; see Which mode am I in? when gravity is unclear.` as const;

export type CheapExplorationHelpImpactPreviewVsEnvelopeComparisonRow = {
  readonly aspect: string;
  readonly impactPreview: string;
  readonly sketchAChange: string;
};

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_COMPARISON_ROWS: readonly CheapExplorationHelpImpactPreviewVsEnvelopeComparisonRow[] =
  [
    {
      aspect: "Purpose",
      impactPreview: "Policy cheap envelope — re-simulate policy packs and recorded findings on a proposed change.",
      sketchAChange: "Architecture desk cheap envelope — clone from sealed snapshot into the next editable draft.",
    },
    {
      aspect: "Desk entry",
      impactPreview: "Nested Impact preview under the architecture desk (SN-007).",
      sketchAChange: "Sketch a change CTA after spawn lock on the current architecture draft.",
    },
    {
      aspect: "Review type stamp",
      impactPreview: "Review-time policy analysis — not a review-type chooser flip.",
      sketchAChange: `${WORKING_REHEARSAL_DOOR_LABEL} until you execute ${WORKING_CAREER_DOOR_LABEL} (career / rehearsal tokens unchanged).`,
    },
    {
      aspect: "Compare use",
      impactPreview: "Neither path is draft-to-draft Compare.",
      sketchAChange: "Neither path is draft-to-draft Compare — sealed-record pairwise diff needs two finalized signed packages (R12).",
    },
    {
      aspect: "Sponsor proof",
      impactPreview: "Orient before sponsor brief — not procurement proof alone.",
      sketchAChange: `${WORKING_REHEARSAL_DOOR_LABEL} labeling on sketches — not sealed-record proof until Record finalize.`,
    },
  ] as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_R12_HEADING =
  "R12 and sealed-record Compare" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_R12_BODY =
  "Record proof for Compare still needs two finalized signed packages (R12). Cheap envelopes help you explore policy impact or open the next sketch — they do not replace Compare two reviews or unseal a parent snapshot." as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_MODE_RELATION_HEADING =
  "Workspace mode and desk gravity" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_MODE_RELATION_BODY =
  "Cheap envelopes assume Working desk gravity after spawn — nested reviews are job inspectors on the architecture object, not a second home product. Guided teaching chrome may hide desk CTAs until you switch modes." as const;

export type CheapExplorationHelpImpactPreviewVsEnvelopeContrastedPathLink = {
  readonly label: string;
  readonly helpHref: string;
  readonly workspaceHref: string;
  readonly detail: string;
};

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CONTRASTED_PATHS: readonly CheapExplorationHelpImpactPreviewVsEnvelopeContrastedPathLink[] =
  [
    {
      label: "Impact preview",
      helpHref: IMPACT_PREVIEW_HELP_CANONICAL_PATH,
      workspaceHref: IMPACT_PREVIEW_CANONICAL_PATH,
      detail: "Policy cheap envelope — simulate pack and finding impact before you treat output as sealed-record proof.",
    },
    {
      label: "Sketch a change",
      helpHref: CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PATH,
      workspaceHref: inAppHelpHref("architecture-desk"),
      detail: "Architecture sketch envelope — labeled clone from snapshot on the desk, not nested policy preview.",
    },
  ] as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_ADR_REFERENCES = [
  { id: "0092", path: CHEAP_EXPLORATION_ADR_0092_RELATIVE_PATH },
] as const;

export type CheapExplorationHelpImpactPreviewVsEnvelopeRelatedLink = {
  readonly label: string;
  readonly href: string;
};

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_TOPICS_HEADING_ID =
  "help-impact-preview-vs-envelope-related-topics" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_TOPICS_HEADING = "Related topics" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_TOPICS: readonly CheapExplorationHelpImpactPreviewVsEnvelopeRelatedLink[] =
  [
    { label: "Impact preview", href: inAppHelpHref("impact-preview") },
    { label: "Sketch a change", href: inAppHelpHref("sketch-a-change") },
    { label: "Architecture desk — system, not job", href: inAppHelpHref("architecture-desk") },
    { label: "Which mode am I in?", href: MODE_GRAVITY_HELP_WHICH_MODE_PATH },
    { label: "Record vs Practice on the Working desk", href: inAppHelpHref("career-vs-rehearsal") },
    { label: "Compare two reviews", href: inAppHelpHref("comparison-replay") },
  ] as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
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
  { level: 2, id: "help-impact-preview-vs-envelope-comparison", title: "Impact preview vs Sketch a change" },
  { level: 2, id: "help-impact-preview-vs-envelope-contrasted-paths", title: "Contrasted paths" },
  { level: 2, id: "help-impact-preview-vs-envelope-r12", title: CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_R12_HEADING },
  {
    level: 2,
    id: "help-impact-preview-vs-envelope-mode-relation",
    title: CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_MODE_RELATION_HEADING,
  },
  { level: 2, id: "help-impact-preview-vs-envelope-adr-mapping", title: "Technical mapping and ADRs" },
  { level: 2, id: "help-impact-preview-vs-envelope-where-to-go-next", title: "Where to go next" },
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
  overviewMustNotContain: ["does not observe", "not production observation", "Sources package"],
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
] as const;
