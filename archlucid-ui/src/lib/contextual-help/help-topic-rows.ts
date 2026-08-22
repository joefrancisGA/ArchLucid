/** Long-form help topics (`/help/**`). */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { ACCELERATOR_CHOOSER_HELP_PAGE_TITLE } from "@/lib/accelerator-chooser-help-guide-content";
import { DATA_HANDLING_TENANT_ISOLATION_HELP_TOPIC_LABEL } from "@/lib/data-handling-tenant-isolation-help-evidence-copy";
import { SPONSOR_REPORT_HELP_TOPIC_LABEL } from "@/lib/sponsor/sponsor-report-help-evidence-copy";
import { PATH_CHOOSER_HELP_TOPIC_LABEL } from "@/lib/path-chooser-help-evidence-copy";
import { PILOT_FEEDBACK_HELP_TOPIC_LABEL } from "@/lib/pilot-feedback-help-evidence-copy";
import { PILOT_GUIDE_HELP_TOPIC_LABEL } from "@/lib/pilot-guide-help-evidence-copy";
import { PLANNING_PATH } from "@/lib/planning-route";
import { PRODUCT_LEARNING_PATH } from "@/lib/product-learning-route";

export const HELP_TOPIC_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: "/help/data-handling",
    entry: {
      whatIsThisPage: `${DATA_HANDLING_TENANT_ISOLATION_HELP_TOPIC_LABEL} — review evidence flow, tenant scope, and three-layer isolation.`,
      whatToDoNext:
        "Open Trust Center or Assurance status for diligence artifacts, then review Sources before sponsor briefings.",
      whyEmpty: "This guide always shows isolation and data-handling content when the help topic loads.",
      whereToConfigurePrerequisite: "Confirm residency and subprocessors during procurement with your account team.",
    },
  },
  {
    prefix: "/help/dpa-template",
    entry: {
      whatIsThisPage:
        "Working Data Processing Agreement negotiation template for counsel — not a countersigned DPA.",
      whatToDoNext:
        "Open Trust Center for the diligence pack, review Subprocessors, then expand the full template with counsel.",
      whyEmpty: "Orientation and CTAs always appear when this help topic loads; expand the disclosure for clauses.",
      whereToConfigurePrerequisite: "Execute a DPA only through your procurement counsel and account team.",
    },
  },
  {
    prefix: "/help/soc2-self-assessment",
    entry: {
      whatIsThisPage:
        "Owner SOC 2 Trust Services Criteria self-assessment — not a CPA Type I or Type II attestation.",
      whatToDoNext:
        "Open Trust Center for the diligence pack, use CAIQ/SIG for questionnaires, then read the control summary as readiness mapping only.",
      whyEmpty: "Orientation and CTAs always appear when this help topic loads.",
      whereToConfigurePrerequisite:
        "CPA attestation and third-party pen-test publication remain owner programs outside this page.",
    },
  },
  {
    prefix: "/help/choose-your-next-step",
    entry: {
      whatIsThisPage: `${PATH_CHOOSER_HELP_TOPIC_LABEL} — map your goal to one primary next action for evaluate, pilot, procurement, sponsor, or engineering support.`,
      whatToDoNext:
        "Pick the matching goal branch, open the primary cite, then use Sources before treating orientation as diligence.",
      whyEmpty: "Branches always appear when this help topic loads.",
      whereToConfigurePrerequisite: "Start or finalize a review when your goal needs product evidence, not just orientation.",
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
    },
  },
  {
    prefix: "/help/configuration-reference",
    entry: {
      whatIsThisPage:
        "Admin configuration task guide for SSO, identity providers, and production-like hosting posture.",
      whatToDoNext:
        "Open the matching settings CTA (SSO or identity providers), then expand the key catalog appendix only if needed.",
      whyEmpty: "This guide always shows configuration tasks when the help topic loads.",
      whereToConfigurePrerequisite: "Admin access to identity settings and the configuration summary.",
    },
  },
  {
    prefix: "/help/cli-usage",
    entry: {
      whatIsThisPage:
        "CLI usage engineering runbook — non-interactive archlucid commands, environment variables, exit codes, and API starter fixtures.",
      whatToDoNext:
        "Prefer customer Troubleshooting and System health first, then use CLI detail; open engineering troubleshooting when logs need deeper triage.",
      whyEmpty: "This reference always shows when the help topic loads.",
      whereToConfigurePrerequisite:
        "CLI and API automation need credentials and workspace scope configured for the target environment.",
    },
  },
  {
    prefix: "/help/engineering-troubleshooting",
    entry: {
      whatIsThisPage:
        "Admin engineering troubleshooting runbook for CLI, environment, and log triage after customer Troubleshooting.",
      whatToDoNext:
        "Prefer Customer Troubleshooting and System health first, then use eng CLI/env detail; open Report a problem when filing a ticket.",
      whyEmpty: "This runbook always shows when the help topic loads for Admins.",
      whereToConfigurePrerequisite: "Admin access; Architects should use the customer Troubleshooting guide instead.",
    },
  },
  {
    prefix: "/help/api-contracts",
    entry: {
      whatIsThisPage:
        "Admin HTTP and OpenAPI contract reference for integrators — not the buyer Resolve outcomes FAQ.",
      whatToDoNext:
        "Open CLI usage for tooling, or Resolve outcomes if you need buyer approval workflows.",
      whyEmpty: "Orientation and stripped contract reference always show when this Admin help topic loads.",
      whereToConfigurePrerequisite: "Admin access; treat OpenAPI as the contract of record when prose disagrees.",
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
    },
  },
  {
    prefix: "/help/admin-diagnostics",
    entry: {
      whatIsThisPage:
        "Admin diagnostics — system status, workspace readiness, assistant diagnostics, and observability signals for platform health.",
      whatToDoNext:
        "Open System health for live probes, or Engineering troubleshooting when CLI and log triage are required.",
      whyEmpty: "This guide is always available; live probe tiles appear on System health after the workspace responds.",
      whereToConfigurePrerequisite:
        "Deep diagnostics often require ArchLucid personnel or admin roles; customer tenants use Troubleshooting first.",
      whatToDoNextAction: {
        label: "Open System health",
        href: "/administration/system-health",
      },
      whereToConfigureAction: {
        label: "Open Engineering troubleshooting",
        href: "/help/engineering-troubleshooting",
      },
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
    },
  },
  {
    prefix: "/help/caiq-sig-response",
    entry: {
      whatIsThisPage:
        "CAIQ / SIG questionnaire responses — pre-filled CAIQ Lite and SIG Core mapped to in-repo evidence for procurement reviewers.",
      whatToDoNext:
        "Use the questionnaire pre-fills with counsel, then open SOC 2 self-assessment or Trust Center for related assurance surfaces.",
      whyEmpty: "This guide is always available; live diligence packs appear after your tenant publishes Trust Center materials.",
      whereToConfigurePrerequisite:
        "CPA SOC 2 attestation and third-party pen-test publication remain owner programs outside this page.",
      whatToDoNextAction: {
        label: "Open SOC 2 self-assessment",
        href: "/help/soc2-self-assessment",
      },
      whereToConfigureAction: {
        label: "Open Trust Center",
        href: "/trust",
      },
    },
  },
  {
    prefix: "/help/getting-started",
    entry: {
      whatIsThisPage:
        "Getting started guide — how ArchLucid turns evidence into findings, decisions, and export-ready review outputs.",
      whatToDoNext:
        "Start a review, open the sample walkthrough, or pick a path from Choose your next step when you know your goal.",
      whyEmpty: "This guide is always available; review metrics appear after you create or finalize reviews.",
      whereToConfigurePrerequisite:
        "Choose a workspace in the header scope switcher before starting a real (non-sample) review.",
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
    },
  },
  {
    prefix: "/help/alerts",
    entry: {
      whatIsThisPage:
        "How alerts work — how ArchLucid raises, routes, and resolves alert notifications for architects.",
      whatToDoNext:
        "Open the alerts inbox or Alert rules, then confirm destinations and conditions for this workspace.",
      whyEmpty: "This guide is always available; live inbox and rules appear after reviews raise alerts.",
      whereToConfigurePrerequisite:
        "Alert delivery often needs channel integrations configured under Integrations.",
    },
  },
  {
    prefix: "/help/procurement",
    entry: {
      whatIsThisPage:
        "Procurement FAQ — buyer-facing answers on diligence packs, questionnaires, and how to request security review materials.",
      whatToDoNext:
        "Open Assurance status or Trust Center for public assurance, or settings Security & Trust when requesting NDA-gated packs.",
      whyEmpty: "This FAQ is always available; NDA packs require contacting the security mailbox listed in the guide.",
      whereToConfigurePrerequisite:
        "No workspace toggle is required — this page is procurement orientation vocabulary only.",
    },
  },
  {
    prefix: "/help/scope",
    entry: {
      whatIsThisPage:
        "Workspace and scope guide — how tenant, workspace, and project boundaries work with the header switcher.",
      whatToDoNext:
        "Confirm the header scope switcher, then open Users and roles or Users settings when access needs adjustment.",
      whyEmpty: "This guide is always available; live scope labels appear in the workspace header after sign-in.",
      whereToConfigurePrerequisite:
        "Changing tenant or project membership needs Admin authority in the target workspace.",
    },
  },
  {
    prefix: "/help/evidence-trail",
    entry: {
      whatIsThisPage:
        "Evidence graph guide — how to trace findings, artifacts, and provenance without exposing raw engineering logs.",
      whatToDoNext:
        "Open the live Evidence graph, Search review evidence, or Validate review when you need package-level trails.",
      whyEmpty: "This guide is always available; live graph nodes appear after finalized reviews exist.",
      whereToConfigurePrerequisite:
        "Evidence graph depth follows finalized reviews in the current workspace and project scope.",
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
    },
  },
];
