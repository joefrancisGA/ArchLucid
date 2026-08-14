import { DESIGN_TOKENS, MARKETING_SURFACES, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/**
 * Class bundles for the Sources band. Heading and list classes are identical on every surface
 * (`MARKETING_TYPOGRAPHY.cardTitle` and `.body` alias the operator scale), so only the panel wash,
 * the intro scale, and the link treatment vary.
 */
export type EvidenceOrientationSourcesStyle = {
  readonly panel: string;
  readonly intro: string;
  readonly link: string;
};

const SOURCES_PANEL_MUTED =
  "rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40";

const SOURCES_PANEL_RAISED = "rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800";

const SOURCES_INTRO_BASE = "m-0 mt-1 max-w-3xl text-al-text-secondary";

/** Operator help intros sit one step below body copy; evaluation surfaces keep the body scale. */
const SOURCES_INTRO_HELPER = cn(SOURCES_INTRO_BASE, OPERATOR_TYPOGRAPHY.helper);

const SOURCES_INTRO_BODY = cn(SOURCES_INTRO_BASE, OPERATOR_TYPOGRAPHY.body);

/** Operator Sources links keep a 24px pointer target without inflating the chip row. */
const SOURCES_LINK_OPERATOR = cn(OPERATOR_LINK.inline, "inline-flex min-h-6 items-center py-1 font-medium");

const SOURCES_LINK_LEGACY_TEAL = MARKETING_SURFACES.inlineLink;

export const EVIDENCE_SOURCES_STYLE = {
  /** Operator help surfaces: muted panel, helper-scale intro, tokenised inline link. */
  operatorMuted: {
    panel: SOURCES_PANEL_MUTED,
    intro: SOURCES_INTRO_HELPER,
    link: SOURCES_LINK_OPERATOR,
  },
  /** Operator follow-up bands that sit on an already-muted page section. */
  operatorRaised: {
    panel: SOURCES_PANEL_RAISED,
    intro: SOURCES_INTRO_HELPER,
    link: SOURCES_LINK_OPERATOR,
  },
  /** Operator follow-up bands that share ruled section chrome with sibling help sections. */
  operatorNeutral: {
    panel: "space-y-3",
    intro: SOURCES_INTRO_HELPER,
    link: SOURCES_LINK_OPERATOR,
  },
  /** Evaluation (marketing / pre-finalize) surfaces still on the legacy teal link. */
  evaluationMuted: {
    panel: SOURCES_PANEL_MUTED,
    intro: SOURCES_INTRO_BODY,
    link: SOURCES_LINK_LEGACY_TEAL,
  },
  /** Evaluation surfaces already migrated to the accent-link token. */
  evaluationMutedAccentLink: {
    panel: SOURCES_PANEL_MUTED,
    intro: SOURCES_INTRO_BODY,
    link: MARKETING_SURFACES.inlineLink,
  },
  /** Pre-finalize overview band, where the Sources panel itself carries the info callout. */
  evaluationInfoCallout: {
    panel: cn(DESIGN_TOKENS.callout.info, "p-3"),
    intro: SOURCES_INTRO_BODY,
    link: SOURCES_LINK_LEGACY_TEAL,
  },
} as const satisfies Record<string, EvidenceOrientationSourcesStyle>;

/** Class bundle for the claim-discipline band. */
export type EvidenceOrientationClaimStyle = {
  readonly panel: string;
  /** Extra body-paragraph classes beyond the shared `m-0` / `mt-2` rhythm. */
  readonly body?: string;
};

/**
 * Pastel caution wash on evaluation surfaces. `UI_DESIGN_SYSTEM.md` bans decorative pastel panels, so
 * this should converge on {@link DESIGN_TOKENS.callout.warn}; it is isolated here so that is one edit.
 */
const CLAIM_PANEL_EVALUATION_CAUTION =
  "rounded-md border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20";

const CLAIM_PANEL_EVALUATION_NEUTRAL =
  "rounded-md border border-neutral-200 bg-neutral-50/40 p-3 dark:border-neutral-700 dark:bg-neutral-900/30";

export const EVIDENCE_CLAIM_STYLE = {
  operatorWarn: { panel: cn(DESIGN_TOKENS.callout.warn, "p-3") },
  operatorInfo: { panel: cn(DESIGN_TOKENS.callout.info, "p-3") },
  operatorNeutral: { panel: cn(DESIGN_TOKENS.callout.neutral, "p-3") },
  /** Inline disclaimer on help guides — no peer card chrome beside Start here panels. */
  operatorInlineNote: {
    panel: "border-l-2 border-neutral-300 pl-3 dark:border-neutral-700",
    body: "text-al-text-secondary",
  },
  evaluationCaution: { panel: CLAIM_PANEL_EVALUATION_CAUTION },
  evaluationNeutral: { panel: CLAIM_PANEL_EVALUATION_NEUTRAL, body: "text-al-text-secondary" },
} as const satisfies Record<string, EvidenceOrientationClaimStyle>;

/** Shared heading class for both bands — identical on operator and evaluation surfaces. */
export const EVIDENCE_ORIENTATION_HEADING_CLASS = cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle);
