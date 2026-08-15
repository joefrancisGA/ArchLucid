/** Home and architecture review routes (`/`, `/architecture/**`). */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const ARCHITECTURE_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    // Exact `/` only — matcher uses path === prefix; startsWith(`${prefix}/`) is `//` and does not steal other routes.
    prefix: "/",
    entry: {
      whatIsThisPage:
        `${OPERATOR_NAV_LINK_LABELS.home} — start or resume architecture reviews and see recent activity from one command center.`,
      whatToDoNext: "Start a review, resume a draft, or explore a sample workspace.",
      whyEmpty: "Recent reviews and metrics appear after you create or finalize architecture reviews.",
      whereToConfigurePrerequisite: "Switch workspace or project scope from the header switcher when you work across teams.",
    },
  },
  {
    prefix: "/architecture/reviews",
    entry: {
      whatIsThisPage: "Create, refine, evaluate, and approve architecture reviews from one hub.",
      whatToDoNext: "Start a review, resume a draft, or explore a sample workspace.",
      whyEmpty: "Summary metrics populate after you start or finalize architecture reviews.",
      whereToConfigurePrerequisite: "Switch workspace or project scope from the header switcher.",
    },
  },
  {
    prefix: "/architecture/reviews/new",
    entry: {
      whatIsThisPage:
        "Start an architecture review by choosing an intake path and submitting evidence for analysis.",
      whatToDoNext:
        "Pick quick, guided, or detailed intake, complete the required fields, then submit to create the review.",
      whyEmpty: "Path choices appear immediately; review results appear after you submit intake.",
      whereToConfigurePrerequisite:
        "Reviews use the workspace and project selected in the header switcher.",
    },
  },
  {
    prefix: "/architecture/architectures/new",
    entry: {
      whatIsThisPage:
        "Create architecture - start a new architecture draft or continue a saved draft before filing evidence for review.",
      whatToDoNext:
        "Start a new draft or resume a recent one, then open Start a review when the brief is ready for evidence intake.",
      whyEmpty:
        "Recent drafts appear after the architectures API responds; empty lists mean no drafts are saved yet.",
      whereToConfigurePrerequisite:
        "Drafting uses the workspace and project selected in the header switcher; creating a draft does not start a review.",
    },
  },
  {
    prefix: "/architecture/first-review-guide",
    entry: {
      whatIsThisPage:
        "First review guide - checklist onboarding for your first architecture review, including required setup and optional workspace steps.",
      whatToDoNext:
        "Clear required setup blockers, follow the walkthrough next step, then Start a review when the workspace is ready for evidence intake.",
      whyEmpty: "Progress updates as you complete walkthrough steps; empty optional setup means those integrations are not required yet.",
      whereToConfigurePrerequisite:
        "Required setup uses the current workspace and project scope from the header switcher.",
    },
  },
];
