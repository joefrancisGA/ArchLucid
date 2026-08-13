import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { GOVERNANCE_DECISION_REGISTER_PATH } from "@/lib/governance/governance-route-paths";
import { DECISION_REGISTER_HELP_TOPIC_LABEL } from "@/lib/decision-register-help-evidence-copy";

export const DECISION_REGISTER_HELP_PAGE_TITLE = "Decision register";

export const DECISION_REGISTER_HELP_PAGE_SUBTITLE =
  "Browse architecture decisions locked with signed review records — category, confidence, findings, and lineage.";

export const DECISION_REGISTER_HELP_OVERVIEW =
  "The decision register is the workspace index of architecture decisions recorded when reviews are signed. Use it to filter and open decisions — not as a standalone diligence Sources package.";

export const DECISION_REGISTER_HELP_PRIMARY_ACTION = {
  label: "Open decision register",
  href: GOVERNANCE_DECISION_REGISTER_PATH,
} as const;

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
    label: "Governance approval",
    detail: "Open governance approval help when disposition workflows need orientation.",
  },
] as const;

export const DECISION_REGISTER_HELP_HOW_TO_READ_STEPS = [
  "Filter the register to the workspace scope and time range you care about.",
  "Open a decision card to read the recorded disposition and linked review.",
  "Follow findings or audit trail when the decision needs live triage or assurance cites.",
] as const;

export const DECISION_REGISTER_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-decision-register-shows", title: "What the decision register shows" },
  { level: 2, id: "how-decision-register-works", title: DECISION_REGISTER_HELP_TOPIC_LABEL },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
