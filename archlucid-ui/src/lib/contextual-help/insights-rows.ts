/** Insights and executive reporting routes (`/insights/**`, executive dashboard). */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { REVIEWS_LIST_PATH, REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive/executive-dashboard-route";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";
import { PLANNING_PATH } from "@/lib/planning-route";
import { PRODUCT_LEARNING_PATH } from "@/lib/product-learning-route";

export const INSIGHTS_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: EXECUTIVE_DASHBOARD_HREF,
    entry: {
      whatIsThisPage:
        "Executive dashboard — portfolio ROI trends, sponsor exports, and workspace-health KPI tiles for governance posture in the current scope.",
      whatToDoNext:
        "Review KPI tiles and sponsor exports, then open Workspace health or Decisions needed for governance follow-up.",
      whyEmpty:
        "Tiles stay at zero until you finalize reviews and governance activity exists in the current workspace scope.",
      whereToConfigurePrerequisite:
        "Switch workspace or project scope from the header switcher — figures never roll up across workspaces.",
      whatToDoNextAction: {
        label: "Open approval queue",
        href: GOVERNANCE_APPROVAL_QUEUE_PATH,
      },
    },
  },
  {
    prefix: "/insights/ask-review-questions",
    entry: {
      whatIsThisPage:
        "Ask plain-language questions about a finalized review; answers use the signed record and cite findings when available.",
      whatToDoNext:
        "Select a review, ask about risk or evidence, then open cited findings or the evidence trail under the answer.",
      whyEmpty: "Threads appear after you ask a question against a selected review.",
      whereToConfigurePrerequisite: "Finalize or open a review so Ask can ground answers in its evidence.",
    },
  },
  {
    prefix: "/insights/compare-two-reviews",
    entry: {
      whatIsThisPage:
        "Compare two finalized reviews to see what changed in scope, findings, decisions, governance, and evidence.",
      whatToDoNext:
        "Pick baseline and updated reviews, run Compare, then open Sources for each side before briefing sponsors.",
      whyEmpty: "Results appear after you compare two finalized reviews.",
      whereToConfigurePrerequisite: "Finalize at least two reviews in this workspace first.",
    },
  },
  {
    // TB-1814 — Learn more maps to repeat-review-loop (recurring patterns across reviews).
    prefix: "/insights/patterns",
    entry: {
      whatIsThisPage:
        "Browse anonymized architecture patterns with adoption, risk, and governance signals from thresholded aggregates.",
      whatToDoNext:
        "Filter the catalog, open a pattern detail, or start a review when a pattern fits your next change.",
      whyEmpty:
        "Patterns appear when anonymized aggregates meet privacy thresholds, or when sample catalog data is shown.",
      whereToConfigurePrerequisite:
        "Live aggregates need enough finalized reviews across anonymized tenants to meet the privacy threshold.",
      whatToDoNextAction: {
        label: "Start a review",
        href: REVIEWS_NEW_PATH,
      },
    },
  },
  {
    prefix: "/insights/search-review-evidence",
    entry: {
      whatIsThisPage:
        "Search findings, decisions, and signed review evidence across the workspace index, optionally scoped to one review.",
      whatToDoNext:
        "Enter a phrase, optionally limit to a review, then open the hit, Evidence trail, or Sources cites before briefing.",
      whyEmpty: "Matches appear after committed review evidence is indexed and your query finds relevant chunks.",
      whereToConfigurePrerequisite: "Finalize reviews so findings and signed records are available to search.",
    },
  },
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
    // TB-2050 — Learn more omitted (no specialty); Category-1 still mounts.
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
    prefix: "/insights/executive-summary",
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
