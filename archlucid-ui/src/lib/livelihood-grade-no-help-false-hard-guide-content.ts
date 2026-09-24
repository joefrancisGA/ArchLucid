/** LN-024 — help: hard vs soft infeasibility on Working Career. */
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { HARD_INFEASIBLE_MISSING_CITATION_EXPORT_BLOCKED_REASON } from "@/lib/feasibility/feasibility-verdict-citation";
import { FEASIBILITY_VERDICT_MISSING_HARD_CITATION_LABEL } from "@/lib/feasibility/resolve-feasibility-verdict-for-display";
import { SOFT_INFEASIBLE_ENVELOPE_EXPORT_LEAD } from "@/lib/feasibility/format-feasibility-verdict-markdown-section";
import { LIVELIHOOD_GRADE_NO_ADR_0093_RELATIVE_PATH } from "@/lib/livelihood-grade-no-adr-inventory";
import { LIVELIHOOD_GRADE_NO_DESK_FALSE_HARD_DEMOTED_LINE } from "@/lib/livelihood-grade-no-desk-false-hard-copy";
import { LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SAFETY_HEADING_ID } from "@/lib/livelihood-grade-no-help-false-hard-evidence-copy";
import { LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PATH } from "@/lib/livelihood-grade-no-help-route";
import {
  LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_INVENTORY_DOC_PATH,
  LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS,
} from "@/lib/livelihood-grade-no-hard-infeasible-inventory";
import { KEYBOARD_SHORTCUTS_OPEN_PARAM } from "@/lib/operator/keyboard-shortcuts-dialog-url";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { REVIEW_PACKAGE_LABEL } from "@/lib/usability/canonical-product-terms";
import {
  verdictTierFromFeasibilityKind,
  verdictTierLabel,
} from "@/lib/verdict-taxonomy";
import type { FeasibilityVerdictKind } from "@/types/feasibility-verdict";

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SLUG = "false-hard-infeasibility" as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_TITLE = "Hard vs soft infeasibility";

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PAGE_SUBTITLE =
  "Working Career export honesty — cite law before hard infeasible (LN-024 / ADR 0093)." as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PAGE_SCOPE =
  "Use this guide when a review shows HardInfeasible, SoftInfeasible, or export blocked for missing hard citations on Working Career paths." as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_OVERVIEW_LEAD =
  "Hard infeasible means a law, theorem, or invariant contradiction applies — you must cite it before Career export. Soft infeasible is an explicit operating envelope with labeled assumptions and cost-of-being-wrong. A confident impossible without citation is worse than a labeled soft no." as const;

/** @deprecated Use {@link LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_OVERVIEW_LEAD} — kept for drift guards. */
export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_OVERVIEW = LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_OVERVIEW_LEAD;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SAFETY_TITLE =
  "Cite authority before Career-hard export" as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SAFETY_BODY =
  "Uncited HardInfeasible cannot ship as sponsor-grade Career-hard. The desk demotes missing citations to a defect label, and export gates reuse the shared refusal reason until hardCitations or unsatCoreInvariantKeys are populated." as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SAFETY_STATUS_TAG = "Citation required on export" as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_APPLICABILITY_WORKING =
  "Working Architecture seats run feasibility citation gates on Record (career) finalize, export, decision receipt, and sponsor package paths. Portfolio headline savings stay disposition-aware and deduplicated by FindingId — per-system rows do not sum to the headline." as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_APPLICABILITY_GUIDED =
  "Guided, demo, and trial seats may show teaching chrome and sample scope. Feasibility honesty rules still apply when you move to Working — do not treat practice labeling as sponsor proof." as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_APPLICABILITY_SECURENOW =
  "The SecureNow (Security) product shell does not run Architecture Working Career feasibility export gates — this topic applies to Architecture review workflows and in-app Architecture help routes only." as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_APPLICABILITY_DOOR =
  "Record (career) paths enforce ADR 0093 citation coverage on export. Practice (rehearsal) labeling stays explicit — it is not procurement proof and does not bypass honesty when you switch back to Record." as const;

export type LivelihoodGradeNoHelpFalseHardVerdictVocabularyRow = {
  readonly feasibilityKind: FeasibilityVerdictKind | "HardInfeasible (uncited)";
  readonly verdictTier: string;
  readonly uiLabel: string;
  readonly operatorMeaning: string;
};

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_VERDICT_VOCABULARY_ROWS: readonly LivelihoodGradeNoHelpFalseHardVerdictVocabularyRow[] =
  [
    {
      feasibilityKind: "HardInfeasible",
      verdictTier: verdictTierLabel(verdictTierFromFeasibilityKind("HardInfeasible")),
      uiLabel: verdictTierLabel(verdictTierFromFeasibilityKind("HardInfeasible")),
      operatorMeaning:
        "Law, theorem, or invariant contradiction — export only when hardCitations or unsatCoreInvariantKeys are populated.",
    },
    {
      feasibilityKind: "HardInfeasible (uncited)",
      verdictTier: "Citation needed",
      uiLabel: FEASIBILITY_VERDICT_MISSING_HARD_CITATION_LABEL,
      operatorMeaning: LIVELIHOOD_GRADE_NO_DESK_FALSE_HARD_DEMOTED_LINE,
    },
    {
      feasibilityKind: "SoftInfeasible",
      verdictTier: verdictTierLabel(verdictTierFromFeasibilityKind("SoftInfeasible")),
      uiLabel: verdictTierLabel(verdictTierFromFeasibilityKind("SoftInfeasible")),
      operatorMeaning: SOFT_INFEASIBLE_ENVELOPE_EXPORT_LEAD,
    },
  ] as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SOFT_ENVELOPE_HEADING =
  "SoftInfeasible envelope fields (manifest)" as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SOFT_ENVELOPE_INTRO =
  "When feasibilityVerdict.kind is SoftInfeasible, softEnvelope carries the explicit bounded decision record — not a failed-review error page." as const;

export type LivelihoodGradeNoHelpFalseHardSoftEnvelopeFieldRow = {
  readonly fieldPath: string;
  readonly meaning: string;
};

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SOFT_ENVELOPE_FIELD_ROWS: readonly LivelihoodGradeNoHelpFalseHardSoftEnvelopeFieldRow[] =
  [
    {
      fieldPath: "softEnvelope.confidenceLow / confidenceHigh",
      meaning: "Numeric confidence band rendered on the review feasibility panel and career exports.",
    },
    {
      fieldPath: "softEnvelope.envelopeDescription",
      meaning: "Plain-language scope for when the soft no holds.",
    },
    {
      fieldPath: "softEnvelope.softAssumption",
      meaning: "Explicit assumption the envelope depends on.",
    },
    {
      fieldPath: "softEnvelope.costOfBeingWrong",
      meaning: "Optional cost-of-being-wrong line when the manifest supplies it.",
    },
  ] as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_CITATION_REMEDIATION_HEADING =
  "Citation-gate remediation path" as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_CITATION_REMEDIATION_STEPS: readonly string[] = [
  "On the review Feasibility verdict panel (#feasibility-verdict), confirm feasibilityVerdict.kind and inspect hardCitations plus unsatCoreInvariantKeys.",
  `When kind is HardInfeasible without citation, export surfaces fail closed with: ${HARD_INFEASIBLE_MISSING_CITATION_EXPORT_BLOCKED_REASON}`,
  LIVELIHOOD_GRADE_NO_DESK_FALSE_HARD_DEMOTED_LINE,
  "Add or fix authority citations, re-run honesty checks, then retry finalize or Career export — do not treat the soft envelope as a silent downgrade without reading assumptions.",
] as const;

export type LivelihoodGradeNoHelpFalseHardEnforcementSurface = {
  readonly name: string;
  readonly description: string;
  readonly href: string;
};

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_ENFORCEMENT_SURFACES: readonly LivelihoodGradeNoHelpFalseHardEnforcementSurface[] =
  [
    {
      name: LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS[0]?.surface ?? "Manifest feasibility verdict",
      description: `${LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS[0]?.fieldPath} — HardInfeasible requires citation before Working Career export (${LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS[0]?.ownerPrompt}).`,
      href: inAppHelpHref("findings"),
    },
    {
      name: LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS[1]?.surface ?? "Career artifact honesty (TS)",
      description: `${LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS[1]?.fieldPath} — blocks export when uncited hard remains on the manifest (${LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS[1]?.ownerPrompt}).`,
      href: inAppHelpHref("review-packages"),
    },
    {
      name: LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS[2]?.surface ?? "Career artifact honesty (C#)",
      description: `${LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS[2]?.fieldPath} — server validator parity for uncited hard (${LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS[2]?.ownerPrompt}).`,
      href: inAppHelpHref("review-packages"),
    },
    {
      name: LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS[3]?.surface ?? "Decision receipt",
      description: `${LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS[3]?.fieldPath} — decision receipt export honors the same citation gate (${LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS[3]?.ownerPrompt}).`,
      href: inAppHelpHref("decision-register"),
    },
    {
      name: LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS[4]?.surface ?? "CLI export/finalize",
      description: `${LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS[4]?.fieldPath} — CLI stdout/json surfaces the shared refusal reason (${LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS[4]?.ownerPrompt}).`,
      href: inAppHelpHref("engineering-troubleshooting"),
    },
  ] as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_ADR_REFERENCES = [
  { id: "0093", path: LIVELIHOOD_GRADE_NO_ADR_0093_RELATIVE_PATH },
] as const;

export type LivelihoodGradeNoHelpFalseHardFeasibilityPurposeLink = {
  readonly label: string;
  readonly href: string;
  readonly description: string;
};

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_FEASIBILITY_PURPOSE_LINKS: readonly LivelihoodGradeNoHelpFalseHardFeasibilityPurposeLink[] =
  [
    {
      label: "Record vs Practice on the Working desk",
      href: inAppHelpHref("career-vs-rehearsal"),
      description: "Pick Record before you need Career export gates; Practice stays labeled rehearsal.",
    },
    {
      label: "Extraction fidelity",
      href: inAppHelpHref("extraction-fidelity"),
      description: "Decision-grade findings still need Kind A/B provenance — separate from feasibility citation.",
    },
    {
      label: `${REVIEW_PACKAGE_LABEL}s`,
      href: inAppHelpHref("review-packages"),
      description: "Sponsor handoff strips surface extraction and feasibility honesty before send.",
    },
    {
      label: "Decision register",
      href: inAppHelpHref("decision-register"),
      description: "Decision receipt export uses resolveDecisionReceiptExportBlockedReason for infeasible kinds.",
    },
  ] as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_KEYBOARD_SHORTCUTS_HREF =
  `${LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PATH}?${KEYBOARD_SHORTCUTS_OPEN_PARAM}=1` as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_KEYBOARD_SHORTCUTS_BODY =
  "Open the keyboard shortcuts dialog (Shift+?) from this page or any operator route. Review desk shortcuts help you jump between feasibility, exports, and findings without losing Working context." as const;

export type LivelihoodGradeNoHelpFalseHardRelatedLink = {
  readonly label: string;
  readonly href: string;
};

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_RELATED_TOPICS_HEADING_ID =
  "help-false-hard-infeasibility-related-topics" as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_RELATED_TOPICS_HEADING = "Related topics" as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_RELATED_TOPICS: readonly LivelihoodGradeNoHelpFalseHardRelatedLink[] =
  [
    { label: "Extraction fidelity", href: inAppHelpHref("extraction-fidelity") },
    { label: "Findings", href: inAppHelpHref("findings") },
    { label: "Evidence trail", href: inAppHelpHref("evidence-trail") },
    { label: "Record vs Practice on the Working desk", href: inAppHelpHref("career-vs-rehearsal") },
    { label: "Architecture desk — system, not job", href: inAppHelpHref("architecture-desk") },
  ] as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  {
    level: 2,
    id: LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SAFETY_HEADING_ID,
    title: LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SAFETY_TITLE,
  },
  { level: 2, id: "help-false-hard-infeasibility-applicability", title: "Scope and seat applicability" },
  { level: 2, id: "help-false-hard-infeasibility-verdict-vocabulary", title: "Verdict vocabulary bridge" },
  { level: 2, id: "help-false-hard-infeasibility-soft-envelope", title: LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SOFT_ENVELOPE_HEADING },
  {
    level: 2,
    id: "help-false-hard-infeasibility-citation-remediation",
    title: LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_CITATION_REMEDIATION_HEADING,
  },
  { level: 2, id: "help-false-hard-infeasibility-enforcement-surfaces", title: "Enforcement surfaces" },
  { level: 2, id: "help-false-hard-infeasibility-adr-mapping", title: "ADR 0093 and LN-024" },
  { level: 2, id: "help-false-hard-infeasibility-feasibility-links", title: "Purpose-specific feasibility links" },
  { level: 2, id: "help-false-hard-infeasibility-keyboard-shortcuts", title: "Keyboard shortcuts" },
  { level: 2, id: "help-false-hard-infeasibility-where-to-go-next", title: "Where to go next" },
  {
    level: 2,
    id: LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_RELATED_TOPICS_HEADING_ID,
    title: LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_RELATED_TOPICS_HEADING,
  },
] as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_INVENTORY_DOC_PATH =
  LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_INVENTORY_DOC_PATH;

/** Drift guard — in-app help must not deep-link GitHub blob URLs. */
export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_FORBIDDEN_LINK_MARKERS = ["github.com", "/blob/"] as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_ALIASES = [
  "false hard",
  "hard infeasible",
  "soft infeasible",
  "citation required",
  "impossible without law",
] as const;
