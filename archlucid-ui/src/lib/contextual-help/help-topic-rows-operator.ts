/** Operator workflow and onboarding help topics (`/help/**`). */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { ACCELERATOR_CHOOSER_HELP_PAGE_TITLE } from "@/lib/accelerator-chooser-help-guide-content";
import { SPONSOR_REPORT_HELP_TOPIC_LABEL } from "@/lib/sponsor/sponsor-report-help-evidence-copy";
import { PATH_CHOOSER_HELP_TOPIC_LABEL } from "@/lib/path-chooser-help-evidence-copy";
import { PILOT_FEEDBACK_HELP_TOPIC_LABEL } from "@/lib/pilot-feedback-help-evidence-copy";
import { PILOT_GUIDE_HELP_TOPIC_LABEL } from "@/lib/pilot-guide-help-evidence-copy";
import { PLANNING_PATH } from "@/lib/planning-route";
import { PRODUCT_LEARNING_PATH } from "@/lib/product-learning-route";

export const HELP_TOPIC_CONTEXTUAL_HELP_ROWS_OPERATOR: readonly PageContextualHelpRow[] = [
  {
    prefix: "/help/choose-your-next-step",
    entry: {
      whatIsThisPage: `${PATH_CHOOSER_HELP_TOPIC_LABEL} — map your goal to one primary next action for evaluate, pilot, procurement, sponsor, or engineering support.`,
      whatToDoNext:
        "Pick the matching goal branch, open the primary cite, then use Sources before treating orientation as diligence.",
      whyEmpty: "Branches always appear when this help topic loads.",
      whereToConfigurePrerequisite: "Start or finalize a review when your goal needs product evidence, not just orientation.",
      taskSteps: [
        "Pick the branch that matches your current goal.",
        "Open the primary cited next action.",
        "Use Sources before treating orientation as diligence.",
      ],
    },
  },
  {
    prefix: "/help/pilot-feedback",
    entry: {
      whatIsThisPage: `${PILOT_FEEDBACK_HELP_TOPIC_LABEL} — human judgment signals, ranked improvement opportunities, and how triage differs from recommendation learning.`,
      whatToDoNext:
        "Open Pilot feedback for live aggregates, then Improvement planning when opportunities become themes or draft plans.",
      whyEmpty: "This guide is always available; live feedback rows appear after architects capture review outcomes.",
      whereToConfigurePrerequisite:
        "Pilot feedback is an Internal Ops surface — System Admin authority is typically required.",
      whatToDoNextAction: {
        label: "Open Pilot feedback",
        href: PRODUCT_LEARNING_PATH,
      },
      whereToConfigureAction: {
        label: "Open Improvement planning",
        href: PLANNING_PATH,
      },
      taskSteps: [
        "Open Pilot feedback for live aggregates.",
        "Review ranked improvement opportunities.",
        "Open Improvement planning when themes need plans.",
      ],
    },
  },
  {
    prefix: "/help/sponsor-report",
    entry: {
      whatIsThisPage: `${SPONSOR_REPORT_HELP_TOPIC_LABEL} — export-ready pilot proof, ROI framing, and what executives should expect in exports.`,
      whatToDoNext:
        "Open the live sponsor value report or dashboard, then review Pilot ROI measurement when methodology needs clarity.",
      whyEmpty: "This guide is always available; live sponsor reports populate after finalized reviews exist.",
      whereToConfigurePrerequisite:
        "Sponsor exports need a role that can read finalized architecture reviews in this workspace.",
      taskSteps: [
        "Open the live sponsor value report or dashboard.",
        "Set the reporting period before exporting.",
        "Review Pilot ROI methodology when assumptions need clarity.",
      ],
    },
  },
  {
    prefix: "/help",
    entry: {
      whatIsThisPage:
        "In-app help topic — curated product documentation for architects and evaluators in this workspace.",
      whatToDoNext:
        "Read the topic, then open Getting started or Troubleshooting when you need the next step.",
      whyEmpty: "Help topics are always available; live workspace data appears on workspace surfaces after reviews start.",
      whereToConfigurePrerequisite:
        "Workspace and project scope come from the shell header switcher once you are signed in.",
      whatToDoNextAction: {
        label: "Open Getting started",
        href: "/help/getting-started",
      },
      whereToConfigureAction: {
        label: "Open Troubleshooting",
        href: "/help/troubleshooting",
      },
      taskSteps: [
        "Read this help topic for orientation.",
        "Open Getting started for first-run workflow.",
        "Open Troubleshooting when something is blocked.",
      ],
    },
  },
  {
    prefix: "/help/accelerator-chooser",
    entry: {
      whatIsThisPage:
        `${ACCELERATOR_CHOOSER_HELP_PAGE_TITLE} — map buyer jobs to starter proof packs after your first finalized architecture review.`,
      whatToDoNext:
        "Pick a pack that matches the buyer job, then start the review with the matching accelerator pack.",
      whyEmpty:
        "This guide is always available; accelerator packs appear on Home after you finalize a first review.",
      whereToConfigurePrerequisite:
        "Accelerator packs assume a workspace with at least one finalized architecture review.",
      whatToDoNextAction: {
        label: "Open Path chooser",
        href: "/help/choose-your-next-step",
      },
      whereToConfigureAction: {
        label: "Start a review",
        href: "/architecture/reviews/new",
      },
      taskSteps: [
        "Finalize a first architecture review when packs are empty.",
        "Pick the accelerator pack that matches the buyer job.",
        "Start a review with the selected pack.",
      ],
    },
  },
  {
    prefix: "/help/authentication-sign-in",
    entry: {
      whatIsThisPage:
        "Authentication and sign-in — passwordless work or school accounts, email one-time codes, invitations, SSO, and recovery.",
      whatToDoNext:
        "Sign in when ready, or open Users and roles / Sign-in methods when you need workspace access or recovery steps.",
      whyEmpty: "This guide is always available; live invitations and SSO settings appear after your tenant configures identity.",
      whereToConfigurePrerequisite:
        "SSO and identity-provider changes usually need an Admin role; evaluators can still use email one-time codes when enabled.",
      whatToDoNextAction: {
        label: "Open Users and roles help",
        href: "/help/users-and-roles",
      },
      whereToConfigureAction: {
        label: "Open Sign-in methods",
        href: "/account/security",
      },
      taskSteps: [
        "Sign in with your enabled method when ready.",
        "Open Users and roles help for workspace access.",
        "Open Sign-in methods for recovery or MFA changes.",
      ],
    },
  },
  {
    prefix: "/help/getting-started",
    entry: {
      whatIsThisPage:
        "Getting started guide — how ArchLucid helps you work from named architecture identities through review jobs to export-ready outputs.",
      whatToDoNext:
        "Open an architecture identity, resume a child draft, inspect a package, or start a new review when evidence is ready.",
      whyEmpty: "This guide is always available; review metrics appear after you create or finalize reviews.",
      whereToConfigurePrerequisite:
        "Choose a workspace in the header scope switcher before starting a real review job.",
      taskSteps: [
        "Choose workspace scope in the header switcher.",
        "Open Architectures for named identity desks or Reviews for package hubs.",
        "Start a review job when the architecture evidence is ready to evaluate.",
      ],
    },
  },
  {
    prefix: "/help/troubleshooting",
    entry: {
      whatIsThisPage:
        "Troubleshooting — symptom-first guidance to unblock reviews, connections, and architect workflows.",
      whatToDoNext:
        "Start with System health, download a support bundle when needed, then open the matching common-issue card.",
      whyEmpty: "This guide is always available; live dependency status appears on System health.",
      whereToConfigurePrerequisite:
        "Confirm workspace scope in the header switcher before diagnosing tenant-specific failures.",
      taskSteps: [
        "Open System health for dependency status.",
        "Download a support bundle when logs are needed.",
        "Open the matching common-issue card for your symptom.",
      ],
    },
  },
  {
    prefix: "/help/evidence-intake",
    entry: {
      whatIsThisPage:
        "Start a review guide — how to begin from a brief, diagram, document, or cloud evidence and verify intake before finalize.",
      whatToDoNext:
        "Open New architecture review to start intake, or Your first architecture review when you need the guided walkthrough.",
      whyEmpty: "This guide is always available; live intake drafts appear after you create architecture reviews.",
      whereToConfigurePrerequisite:
        "Creating reviews needs a role that can start architecture reviews in this workspace.",
      taskSteps: [
        "Open New architecture review to start intake.",
        "Attach brief, diagram, document, or cloud evidence.",
        "Verify intake completeness before finalize.",
      ],
    },
  },
  {
    prefix: "/help/review-guide",
    entry: {
      whatIsThisPage:
        "Review guide — field reference for naming a review, uploading evidence, confirming scope, and finalizing the package.",
      whatToDoNext:
        "Start an architecture review, or open the First review guide when you need the walkthrough instead of field detail.",
      whyEmpty: "This guide is always available; live architecture reviews appear after you create them in this workspace.",
      whereToConfigurePrerequisite:
        "Creating reviews needs a role that can start architecture reviews in this workspace.",
      taskSteps: [
        "Start an architecture review from the reviews hub.",
        "Use this guide for field-level intake reference.",
        "Open First review guide when you need a walkthrough instead.",
      ],
    },
  },
  {
    prefix: "/help/pilot-guide",
    entry: {
      whatIsThisPage: `${PILOT_GUIDE_HELP_TOPIC_LABEL} — how to prepare for a pilot, run the first architecture review, interpret outputs, and get support.`,
      whatToDoNext:
        "Start an architecture review, or open Your first architecture review when you need the step-by-step walkthrough.",
      whyEmpty: "This guide is always available; live pilot outcomes appear after reviews and sponsor reports exist.",
      whereToConfigurePrerequisite:
        "Running a pilot needs a workspace where architects can create and finalize architecture reviews.",
      taskSteps: [
        "Prepare workspace scope and reviewer access.",
        "Start an architecture review for pilot evidence.",
        "Open Your first architecture review for step-by-step guidance.",
      ],
    },
  },
  {
    prefix: "/help/first-architecture-review",
    entry: {
      whatIsThisPage:
        "Your first architecture review — guided path from evidence intake to a finalized package and export-ready outputs.",
      whatToDoNext:
        "Start an architecture review from the hero CTA, or open the sample review when you want a completed outcome first.",
      whyEmpty: "This guide is always available; live architecture reviews appear after you create them.",
      whereToConfigurePrerequisite:
        "Creating reviews needs a role that can start architecture reviews in this workspace.",
      taskSteps: [
        "Start an architecture review from the primary CTA.",
        "Complete intake and verify evidence before finalize.",
        "Open the sample review when you want a completed outcome first.",
      ],
    },
  },
  {
    prefix: "/help/glossary",
    entry: {
      whatIsThisPage:
        "Glossary — searchable product terms for architects and buyers reviewing ArchLucid vocabulary.",
      whatToDoNext:
        "Look up a term, then open Getting started or Assurance status when you need live workflow or assurance orientation.",
      whyEmpty: "Glossary terms are always listed; search filters the catalog without needing a live review.",
      whereToConfigurePrerequisite:
        "No configuration is required — this page is orientation vocabulary only.",
      taskSteps: [
        "Search for the product term you need to define.",
        "Open Getting started for workflow orientation.",
        "Open Assurance status when diligence vocabulary is the question.",
      ],
    },
  },
];
