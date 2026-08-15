/** TB-2050 secondary hubs and matching specialty help topics. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { ADVISORY_SCANS_HELP_CANONICAL_PATH, ADVISORY_SCANS_HELP_TOPIC_LABEL } from "@/lib/advisory-scans-help-evidence-copy";
import { ADVISORY_SCANS_CANONICAL_PATH } from "@/lib/advisory-scans-evidence-copy";
import {
  DECISION_REGISTER_HELP_CANONICAL_PATH,
  DECISION_REGISTER_HELP_TOPIC_LABEL,
} from "@/lib/decision-register-help-evidence-copy";
import { DECISION_REGISTER_CANONICAL_PATH } from "@/lib/decision-register-evidence-copy";
import {
  IMPACT_PREVIEW_HELP_CANONICAL_PATH,
  IMPACT_PREVIEW_HELP_TOPIC_LABEL,
} from "@/lib/impact-preview-help-evidence-copy";
import { IMPACT_PREVIEW_CANONICAL_PATH } from "@/lib/impact-preview-evidence-copy";
import {
  IMPROVEMENT_PLANNING_HELP_CANONICAL_PATH,
  IMPROVEMENT_PLANNING_HELP_TOPIC_LABEL,
} from "@/lib/improvement-planning-help-evidence-copy";
import { PLANNING_CANONICAL_PATH } from "@/lib/planning-evidence-copy";

export const SECONDARY_HUB_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: DECISION_REGISTER_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Decision register — ${DECISION_REGISTER_HELP_TOPIC_LABEL.toLowerCase()} for signed architecture decisions.`,
      whatToDoNext: "Open the decision register, filter by category, then follow linked reviews or findings.",
      whyEmpty: "This guide is always available; decision rows appear after reviews are signed with recorded decisions.",
      whereToConfigurePrerequisite:
        "Decision register respects the workspace and project selected in the header switcher.",
      whatToDoNextAction: {
        label: "Open decision register",
        href: DECISION_REGISTER_CANONICAL_PATH,
      },
    },
  },
  {
    prefix: IMPROVEMENT_PLANNING_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Improvement planning — ${IMPROVEMENT_PLANNING_HELP_TOPIC_LABEL.toLowerCase()} for themes and prioritized plans.`,
      whatToDoNext: "Capture review feedback, then open Improvement planning to generate themes and plans.",
      whyEmpty: "This guide is always available; themes appear after feedback is captured and analyzed.",
      whereToConfigurePrerequisite:
        "Planning insights respect the workspace and project selected in the header switcher.",
      whatToDoNextAction: {
        label: "Open improvement planning",
        href: PLANNING_CANONICAL_PATH,
      },
    },
  },
  {
    prefix: IMPACT_PREVIEW_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Impact preview — ${IMPACT_PREVIEW_HELP_TOPIC_LABEL.toLowerCase()} for what-if simulations against finalized baselines.`,
      whatToDoNext: "Select a finalized review baseline, define a proposed change, then run the simulation.",
      whyEmpty: "This guide is always available; preview results appear after you run a simulation.",
      whereToConfigurePrerequisite:
        "Impact preview needs at least one finalized architecture review in this workspace.",
      whatToDoNextAction: {
        label: "Open impact preview",
        href: IMPACT_PREVIEW_CANONICAL_PATH,
      },
    },
  },
  {
    prefix: ADVISORY_SCANS_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Advisory scans — ${ADVISORY_SCANS_HELP_TOPIC_LABEL.toLowerCase()} for prioritized follow-up recommendations.`,
      whatToDoNext: "Generate a scan from a finalized review or open Schedules for recurring runs.",
      whyEmpty: "This guide is always available; scans appear after you generate one from a finalized review.",
      whereToConfigurePrerequisite: "Finalize a review first; optional baseline comparison highlights drift.",
      whatToDoNextAction: {
        label: "Open advisory scans",
        href: ADVISORY_SCANS_CANONICAL_PATH,
      },
    },
  },
];
