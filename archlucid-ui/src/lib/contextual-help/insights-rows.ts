/** Insights and sponsor reporting routes (`/insights/**`, sponsor dashboard). */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { PLANNING_PATH } from "@/lib/planning-route";
import { PRODUCT_LEARNING_PATH } from "@/lib/product-learning-route";

export const INSIGHTS_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: "/insights/improvement-planning/plans",
    entry: {
      whatIsThisPage:
        "Review one prioritized improvement plan derived from captured feedback, including status and linked themes.",
      whatToDoNext:
        "Return to Improvement planning for peer plans, or open reviews and findings when this plan needs follow-up.",
      whyEmpty: "Plan detail appears after a plan is generated from captured feedback.",
      whereToConfigurePrerequisite:
        "Plans respect the workspace and project selected in the header switcher.",
      whatToDoNextAction: {
        label: "Open Improvement planning",
        href: PLANNING_PATH,
      },
    },
  },
  {
    prefix: "/insights/improvement-planning",
    entry: {
      whatIsThisPage:
        "Convert review feedback into recurring themes, prioritized improvement plans, and exportable summaries.",
      whatToDoNext: "Capture review feedback or run pilot feedback analysis to generate themes and plans.",
      whyEmpty: "Themes and plans appear after feedback is captured and analyzed.",
      whereToConfigurePrerequisite:
        "Planning insights respect the workspace and project selected in the header switcher.",
      whatToDoNextAction: {
        label: "Open Pilot feedback",
        href: PRODUCT_LEARNING_PATH,
      },
    },
  },
  {
    // Impact preview — specialty help at `/help/impact-preview`.
    prefix: "/insights/impact-preview",
    entry: {
      whatIsThisPage:
        "Estimate before-and-after effects of proposed architecture changes against a finalized review baseline.",
      whatToDoNext: "Select a finalized review baseline, set comparison scope, then run the impact preview.",
      whyEmpty: "Preview results appear after you choose a baseline review and run a simulation.",
      whereToConfigurePrerequisite:
        "Impact preview needs at least one finalized architecture review in this workspace.",
      whatToDoNextAction: {
        label: "Open architecture reviews",
        href: REVIEWS_LIST_PATH,
      },
      whereToConfigureAction: {
        label: "Open architecture reviews",
        href: REVIEWS_LIST_PATH,
      },
    },
  },
  {
    prefix: "/insights/sponsor-report",
    entry: {
      whatIsThisPage:
        "Sponsor report — period summary of finalized reviews, material findings, governance decisions, and directional ROI, with sponsor exports. Absorbs the retired standalone pilot outcomes page.",
      whatToDoNext: "Set the reporting period, apply it, then generate sponsor exports when data is ready.",
      whyEmpty: "The report fills in after you finalize reviews in the selected period.",
      whereToConfigurePrerequisite: "ROI estimates use baseline settings from workspace configuration.",
      whatToDoNextAction: {
        label: "Open ROI summary",
        href: "/insights/roi-summary",
      },
    },
  },
];
