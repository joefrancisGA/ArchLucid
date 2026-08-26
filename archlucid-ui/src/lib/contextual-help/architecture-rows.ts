/** Home and architecture review routes (`/`, `/architecture/**`). */

import {
  ARCHITECTURES_NEW_PATH,
  REVIEWS_NEW_PATH,
} from "@/lib/architecture/architecture-routes";
import {
  CREATE_ARCHITECTURE_LABEL,
  START_REVIEW_LABEL,
} from "@/lib/architecture/architecture-workflow-labels";
import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const ARCHITECTURE_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    // Exact `/` only — matcher uses path === prefix; startsWith(`${prefix}/`) is `//` and does not steal other routes.
    prefix: "/",
    entry: {
      whatIsThisPage:
        `${OPERATOR_NAV_LINK_LABELS.home} — create or review an architecture and see recent workspace activity from one command center.`,
      whatToDoNext:
        "Create architecture, start a review, resume a draft, or explore a completed sample.",
      whyEmpty: "Recent reviews appear after you create or finalize architecture reviews.",
      whereToConfigurePrerequisite:
        "Switch workspace or project scope from the header switcher when you work across teams.",
      whatToDoNextAction: {
        label: CREATE_ARCHITECTURE_LABEL,
        href: ARCHITECTURES_NEW_PATH,
      },
      whereToConfigureAction: {
        label: START_REVIEW_LABEL,
        href: REVIEWS_NEW_PATH,
      },
      taskSteps: [
        "Create architecture from a description, briefs, or connected cloud inventory.",
        "Start a review when you already have diagrams, documents, or inventory to evaluate.",
        "Resume a draft or open a sample review from the cards below.",
      ],
    },
  },
  {
    prefix: "/architecture/reviews",
    entry: {
      whatIsThisPage:
        "Architecture packages hub — start, resume, and manage active and finalized architecture reviews.",
      whatToDoNext:
        "Start a review, create architecture when you need a draft first, resume a draft, or explore a sample workspace.",
      whyEmpty: "Summary metrics populate after you start or finalize architecture reviews.",
      whereToConfigurePrerequisite: "Switch workspace or project scope from the header switcher.",
      taskSteps: [
        "Create architecture when you need to draft before filing evidence for review.",
        "Start a review when you already have architecture evidence ready to evaluate.",
        "Open a recent architecture package or switch workspace from the header when scope changes.",
      ],
    },
  },
  {
    prefix: "/architecture/reviews/new",
    entry: {
      whatIsThisPage:
        "Review architecture — choose an intake path and submit evidence for analysis.",
      whatToDoNext:
        "Pick quick, guided, or detailed intake, complete the required fields, then submit to create the review.",
      whyEmpty: "Path choices appear immediately; review results appear after you submit intake.",
      whereToConfigurePrerequisite:
        "Reviews use the workspace and project selected in the header switcher.",
      taskSteps: [
        "Pick quick, guided, or detailed intake for this review.",
        "Complete required fields before submitting evidence.",
        "Submit intake to create the review and open the workspace.",
      ],
    },
  },
  {
    prefix: "/architecture/architectures/new",
    entry: {
      whatIsThisPage:
        "Create architecture — start a new architecture draft or continue a saved draft before filing evidence for review.",
      whatToDoNext:
        "Describe the system and save a draft, or start a review separately when you already have architecture evidence.",
      whyEmpty:
        "Recent drafts appear after the architectures API responds; empty lists mean no drafts are saved yet.",
      whereToConfigurePrerequisite:
        "Drafting uses the workspace and project selected in the header switcher; saving a draft does not start a review.",
      taskSteps: [
        "Start a new draft or resume a recent saved brief.",
        "Complete required architecture fields before saving.",
        "Optionally start a review when the brief is ready, or review existing evidence without a draft.",
      ],
    },
  },
  {
    prefix: "/architecture/first-review-guide",
    entry: {
      whatIsThisPage:
        "First review guide — checklist onboarding for your first architecture draft or review, including required setup and optional workspace steps.",
      whatToDoNext:
        "Clear required setup blockers, then create architecture or start a review when the workspace is ready.",
      whyEmpty:
        "Progress updates as you complete walkthrough steps; empty optional setup means those integrations are not required yet.",
      whereToConfigurePrerequisite:
        "Required setup uses the current workspace and project scope from the header switcher.",
      whatToDoNextAction: {
        label: CREATE_ARCHITECTURE_LABEL,
        href: ARCHITECTURES_NEW_PATH,
      },
      whereToConfigureAction: {
        label: START_REVIEW_LABEL,
        href: REVIEWS_NEW_PATH,
      },
      taskSteps: [
        "Clear required setup blockers on the checklist.",
        "Create architecture when you need a draft before filing evidence.",
        "Start a review when you already have architecture evidence to evaluate.",
      ],
    },
  },
];
