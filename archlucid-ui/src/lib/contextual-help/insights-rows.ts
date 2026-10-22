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
      taskSteps: [
        "Review plan status and linked themes.",
        "Return to Improvement planning for peer plans.",
        "Open reviews or findings when follow-up work is needed.",
      ],
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
      taskSteps: [
        "Capture review feedback or run pilot feedback analysis.",
        "Review generated themes before promoting them into plans.",
        "Open peer plans when you need to compare prioritized work.",
      ],
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
      taskSteps: [
        "Select a finalized review as the impact baseline.",
        "Define the proposed change and comparison scope.",
        "Run the simulation and review before-and-after effects.",
      ],
    },
  },
  {
    prefix: "/insights/sponsor-report",
    entry: {
      whatIsThisPage:
        "Sponsor report — period summary of finalized reviews, material findings, approval decisions, and directional ROI, with sponsor exports. Absorbs the retired standalone pilot outcomes page.",
      whatToDoNext: "Set the reporting period, apply it, then generate sponsor exports when data is ready.",
      whyEmpty: "The report fills in after you finalize reviews in the selected period.",
      whereToConfigurePrerequisite: "ROI estimates use baseline settings from workspace configuration.",
      whatToDoNextAction: {
        label: "Open ROI summary",
        href: "/insights/roi-summary",
      },
      taskSteps: [
        "Set the reporting period and apply it to refresh the summary.",
        "Review finalized reviews, findings, and approval decisions in scope.",
        "Generate sponsor exports when the narrative is ready to share.",
      ],
    },
  },
];
