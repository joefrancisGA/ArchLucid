import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { GOVERNANCE_DECISION_REGISTER_PATH } from "@/lib/governance/governance-route-paths";
import {
  DECISION_REGISTER_EMPTY_TEACHING_BODY,
  DECISION_REGISTER_EMPTY_TEACHING_HONESTY,
} from "@/lib/decision-register-empty-teaching";
import {
  DECISION_REGISTER_HELP_CLAIM_DISCIPLINE_HEADING,
  DECISION_REGISTER_HELP_TOPIC_LABEL,
} from "@/lib/decision-register-help-evidence-copy";
import {
  DECISION_REGISTER_CATEGORY_LABEL,
  DECISION_REGISTER_CONFIDENCE_BASIS_LABEL,
} from "@/app/(operator)/governance/decision-register/decision-register-copy";

export const DECISION_REGISTER_HELP_BREADCRUMB_TOPIC_TITLE = "Decision register";

export const DECISION_REGISTER_HELP_PAGE_TITLE = "Decision register";

export const DECISION_REGISTER_HELP_PAGE_SUBTITLE =
  "Browse architecture decisions locked with sealed review records — category, confidence, findings, and lineage.";

export const DECISION_REGISTER_HELP_OVERVIEW =
  "The decision register is the workspace index of architecture decisions recorded when reviews are finalized and sealed. Use it to filter and open decisions tied to signed review records — not to triage live findings.";

export const DECISION_REGISTER_HELP_PRIMARY_ACTION = {
  label: "Open decision register",
  href: GOVERNANCE_DECISION_REGISTER_PATH,
} as const;

export const DECISION_REGISTER_HELP_START_HERE_CARD_TITLE = "Start here";

export const DECISION_REGISTER_HELP_ROLE_PRECONDITION_TAG = "Read";

export const DECISION_REGISTER_HELP_ROLE_PRECONDITION =
  "Browse architecture decisions with workspace read access after a review is finalized and its sealed review record is locked.";

export const DECISION_REGISTER_HELP_START_HERE_PRECONDITION = DECISION_REGISTER_EMPTY_TEACHING_BODY;

export const DECISION_REGISTER_HELP_START_HERE_HELPER = DECISION_REGISTER_EMPTY_TEACHING_HONESTY;

export type DecisionRegisterHelpTileItem = {
  readonly label: string;
  readonly detail: string;
};

export const DECISION_REGISTER_HELP_TILE_ITEMS: readonly DecisionRegisterHelpTileItem[] = [
  {
    label: "Signed decisions",
    detail: "Each row links to the architecture review and findings that justified the recorded decision.",
  },
  {
    label: "Filters",
    detail: "Narrow by date, category, or confidence before opening a decision card.",
  },
  {
    label: "Lineage",
    detail: "Follow linked reviews and findings when a decision needs follow-up or audit context.",
  },
  {
    label: DECISION_REGISTER_CATEGORY_LABEL,
    detail: "Architecture domain labels such as Security or Cost appear on each decision card and filter panel.",
  },
  {
    label: "Confidence",
    detail: "Numeric confidence scores and basis labels show how strongly each recorded decision is supported.",
  },
] as const;

export type DecisionRegisterHelpFieldExampleRow = {
  readonly fieldLabel: string;
  readonly exampleValue: string;
  readonly detail: string;
};

export const DECISION_REGISTER_HELP_CATEGORY_EXAMPLE = "Security";

export const DECISION_REGISTER_HELP_CONFIDENCE_EXAMPLE = "0.9 (Evidence-backed)";

export const DECISION_REGISTER_HELP_CONFIDENCE_BASIS_EXAMPLE = "Evidence-backed";

export const DECISION_REGISTER_HELP_FIELD_EXAMPLES: readonly DecisionRegisterHelpFieldExampleRow[] = [
  {
    fieldLabel: DECISION_REGISTER_CATEGORY_LABEL,
    exampleValue: DECISION_REGISTER_HELP_CATEGORY_EXAMPLE,
    detail: "Plain text on each decision card and in the category filter.",
  },
  {
    fieldLabel: "Confidence",
    exampleValue: DECISION_REGISTER_HELP_CONFIDENCE_EXAMPLE,
    detail: "Numeric score with basis in parentheses when both are recorded on the card.",
  },
  {
    fieldLabel: DECISION_REGISTER_CONFIDENCE_BASIS_LABEL,
    exampleValue: DECISION_REGISTER_HELP_CONFIDENCE_BASIS_EXAMPLE,
    detail: "Filter select options also include Model-assisted and Unknown.",
  },
] as const;

export const DECISION_REGISTER_HELP_HOW_TO_READ_STEPS = [
  "Filter the register to the workspace scope and time range you care about.",
  "Open a decision card to read the recorded disposition and linked review.",
  "Follow findings or audit trail when the decision needs live triage or assurance cites.",
] as const;

export const DECISION_REGISTER_HELP_CLAIM_HEADING_ID = "help-decision-register-claim-discipline-heading" as const;

export const DECISION_REGISTER_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-decision-register-shows", title: "What the decision register shows" },
  { level: 2, id: "how-decision-register-works", title: DECISION_REGISTER_HELP_TOPIC_LABEL },
  {
    level: 2,
    id: DECISION_REGISTER_HELP_CLAIM_HEADING_ID,
    title: DECISION_REGISTER_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard: claim band owns diligence limits; overview and steps stay affirmative. */
export const DECISION_REGISTER_HELP_NEGATION_DRIFT_MARKERS = {
  claimMustNotContain: ["sources package", "sealed-review diligence"],
} as const;
