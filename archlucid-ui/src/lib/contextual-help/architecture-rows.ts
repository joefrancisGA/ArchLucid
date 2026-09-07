/** Home and architecture review routes (`/`, `/architecture/**`). */

import {
  ARCHITECTURES_LIST_PATH,
  ARCHITECTURES_NEW_PATH,
  REVIEWS_LIST_PATH,
  REVIEWS_NEW_PATH,
} from "@/lib/architecture/architecture-routes";
import {
  ARCHITECTURE_IDENTITIES_NAV_LABEL,
  CREATE_ARCHITECTURE_LABEL,
  START_REVIEW_LABEL,
  WORKING_NEW_REVIEW_LABEL,
} from "@/lib/architecture/architecture-workflow-labels";
import type { PageContextualHelpEntry, PageContextualHelpRow } from "@/lib/contextual-help/types";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

const ARCHITECTURE_HOME_WORKING_ENTRY: PageContextualHelpEntry = {
  whatIsThisPage:
    `${OPERATOR_NAV_LINK_LABELS.home} — open architecture identities, resume child drafts, and track recent workspace activity from one command center.`,
  whatToDoNext: "Open an architecture identity, resume a child draft, inspect an architecture package, or start a new review.",
  whyEmpty: "Recent reviews appear after you create or finalize architecture reviews.",
  whereToConfigurePrerequisite:
    "Switch workspace or project scope from the header switcher when you work across teams.",
  whatToDoNextAction: {
    label: WORKING_NEW_REVIEW_LABEL,
    href: ARCHITECTURES_NEW_PATH,
  },
  whereToConfigureAction: {
    label: "Open packages",
    href: REVIEWS_LIST_PATH,
  },
  taskSteps: [
    "Open an architecture identity from Architectures to resume child drafts or linked reviews.",
    "Open an in-progress or finalized architecture package from Reviews.",
    "Inspect sealed records and exports when you need audit-ready outputs.",
  ],
};

const ARCHITECTURE_IDENTITIES_WORKING_ENTRY: PageContextualHelpEntry = {
  whatIsThisPage:
    `${ARCHITECTURE_IDENTITIES_NAV_LABEL} hub — browse named architecture identities with child drafts and reviews for the current scope.`,
  whatToDoNext: "Open an architecture identity desk, resume a child draft, or start a new review from the identity.",
  whyEmpty: "Identities appear after you create an architecture or save a draft linked to an identity.",
  whereToConfigurePrerequisite: "Switch workspace or project scope from the header switcher.",
  taskSteps: [
    "Open an architecture identity to see child drafts and reviews on one desk.",
    "Resume a child draft when the brief still needs refinement.",
    "Start a review from the identity when evidence is ready.",
  ],
};

const ARCHITECTURE_REVIEWS_WORKING_ENTRY: PageContextualHelpEntry = {
  whatIsThisPage:
    "Architecture packages hub — resume, inspect, and manage active and finalized architecture reviews.",
  whatToDoNext: "Open a package, open an architecture identity, or start a new review.",
  whyEmpty: "Summary metrics populate after you start or finalize architecture reviews.",
  whereToConfigurePrerequisite: "Switch workspace or project scope from the header switcher.",
  taskSteps: [
    "Open a recent architecture package to continue review work.",
    "Open an architecture identity when you need the parent system desk.",
    "Start a new review when you are ready to file evidence.",
  ],
};

const ARCHITECTURE_START_WORKING_ENTRY: PageContextualHelpEntry = {
  whatIsThisPage:
    "Start a review — file evidence as a review job under a named architecture identity.",
  whatToDoNext:
    "Confirm the architecture identity, pick an intake path, complete required fields, then submit evidence.",
  whyEmpty: "Path choices appear immediately; review results appear after you submit intake.",
  whereToConfigurePrerequisite:
    "Reviews use the workspace and project selected in the header switcher.",
  taskSteps: [
    "Open or create the architecture identity that owns this review job.",
    "Pick quick, guided, or detailed intake for the evidence you have.",
    "Submit intake to create the review and open the nested workspace.",
  ],
};

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

/** Working desk contextual help overrides for architecture routes (WA-04). */
export function resolveArchitectureContextualHelpEntry(
  prefix: string,
  workingMode: boolean,
): PageContextualHelpEntry | null {
  if (!workingMode) {
    const row = ARCHITECTURE_CONTEXTUAL_HELP_ROWS.find((candidate) => candidate.prefix === prefix);

    return row?.entry ?? null;
  }

  if (prefix === "/") {
    return ARCHITECTURE_HOME_WORKING_ENTRY;
  }

  if (prefix === ARCHITECTURES_LIST_PATH) {
    return ARCHITECTURE_IDENTITIES_WORKING_ENTRY;
  }

  if (prefix === "/architecture/reviews") {
    return ARCHITECTURE_REVIEWS_WORKING_ENTRY;
  }

  if (prefix === REVIEWS_NEW_PATH) {
    return ARCHITECTURE_START_WORKING_ENTRY;
  }

  const row = ARCHITECTURE_CONTEXTUAL_HELP_ROWS.find((candidate) => candidate.prefix === prefix);

  return row?.entry ?? null;
}
