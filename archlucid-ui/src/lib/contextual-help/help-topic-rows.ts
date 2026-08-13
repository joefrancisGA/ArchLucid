/** Long-form help topics (`/help/**`). */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { INTERNAL_REPLAY_PATH } from "@/lib/internal-ops-route-paths";
import { PLANNING_PATH } from "@/lib/planning-route";
import { PRODUCT_LEARNING_PATH } from "@/lib/product-learning-route";
import { REPEAT_REVIEW_LOOP_HELP_INBOUND_LABEL } from "@/lib/repeat-review-loop-help-title-honesty-surfaces";

export const HELP_TOPIC_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: "/help/data-handling",
    entry: {
      whatIsThisPage:
        "Explain how review evidence is handled, what stays in your tenant, and how three-layer isolation works.",
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
      whatIsThisPage:
        "Map your current goal to one primary next action for evaluate, pilot, procurement, sponsor, or engineering support.",
      whatToDoNext:
        "Pick the matching goal branch, open the primary cite, then use Sources before treating orientation as diligence.",
      whyEmpty: "Branches always appear when this help topic loads.",
      whereToConfigurePrerequisite: "Start or finalize a review when your goal needs product evidence, not just orientation.",
    },
  },
  {
    prefix: "/help/enterprise-onboarding",
    entry: {
      whatIsThisPage:
        "Enterprise onboarding checklist - configure SSO, roles, governance, policy packs, audit export, and optional Azure evidence for a hosted tenant.",
      whatToDoNext:
        "Open Identity providers for SSO, Users and roles for access, then Assurance status for assurance orientation.",
      whyEmpty: "This guide is always available; live identity and role surfaces appear after workspace configuration.",
      whereToConfigurePrerequisite:
        "SSO and role changes need System Admin authority in the current workspace.",
    },
  },
  {
    prefix: "/help/pilot-feedback",
    entry: {
      whatIsThisPage:
        "Pilot feedback help — human judgment signals, ranked improvement opportunities, and how triage differs from recommendation learning.",
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
    prefix: "/help/executive-summary",
    entry: {
      whatIsThisPage:
        "Executive summary help — sponsor-safe pilot proof, ROI framing, and what executives should expect in exports.",
      whatToDoNext:
        "Open the live executive value report or dashboard, then review Pilot ROI measurement when methodology needs clarity.",
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
        "Admin HTTP and OpenAPI contract reference for integrators — not the buyer Governance approval FAQ.",
      whatToDoNext:
        "Open CLI usage for tooling, or Governance approval if you need buyer approval workflows.",
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
        "Pick an accelerator pack — map buyer jobs to accelerator packs after your first finalized architecture review.",
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
        href: "/administration/account-security",
      },
    },
  },
  {
    prefix: "/help/azure-boards",
    entry: {
      whatIsThisPage:
        "Azure Boards integration — connect Azure DevOps for work item creation from ArchLucid findings.",
      whatToDoNext:
        "Open Azure Boards settings to connect or test the destination, then confirm Integration readiness.",
      whyEmpty: "This guide is always available; live connector status appears after Azure DevOps is configured for the workspace.",
      whereToConfigurePrerequisite:
        "Outbound work-item creation needs a role that can manage integrations for this workspace.",
      whatToDoNextAction: {
        label: "Open Azure Boards settings",
        href: "/integrations/azure-boards",
      },
      whereToConfigureAction: {
        label: "Open Integration readiness help",
        href: "/help/integration-readiness",
      },
    },
  },
  {
    prefix: "/help/integration-readiness",
    entry: {
      whatIsThisPage:
        "Integration readiness — which notification, ticketing, publishing, and delivery connectors are ready, recommended, or optional.",
      whatToDoNext:
        "Open Connection status for live labels, then configure recommended chat connectors before optional ITSM destinations.",
      whyEmpty: "This guide is always available; live connector status appears on Connection status after setup.",
      whereToConfigurePrerequisite:
        "Connector configuration needs a role that can manage integrations for this workspace.",
      whatToDoNextAction: {
        label: "Open Connection status",
        href: "/administration/connection-status",
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
    prefix: "/help/comparison-replay",
    entry: {
      whatIsThisPage:
        "Compare and replay — diff two architecture reviews, replay a saved comparison, and verify drift without re-running a full review.",
      whatToDoNext:
        "Open Compare two reviews for a live pair diff, or Validate review when you need to re-check a finalized package.",
      whyEmpty: "This guide is always available; live compare and validate tools appear after you finalize architecture reviews.",
      whereToConfigurePrerequisite:
        "Pairwise compare needs two finalized reviews in this workspace; validate needs one finalized package.",
      whatToDoNextAction: {
        label: "Open Compare two reviews",
        href: "/insights/compare-two-reviews",
      },
      whereToConfigureAction: {
        label: "Open Validate review",
        href: INTERNAL_REPLAY_PATH,
      },
    },
  },
  {
    prefix: "/help/getting-started",
    entry: {
      whatIsThisPage:
        "Getting started guide — how ArchLucid turns evidence into findings, decisions, and governance-ready review outputs.",
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
        "How alerts work — how ArchLucid raises, routes, and resolves governance notifications for architects.",
      whatToDoNext:
        "Open the alerts inbox or Alert rules, then confirm destinations and conditions for this workspace.",
      whyEmpty: "This guide is always available; live inbox and rules appear after reviews raise alerts.",
      whereToConfigurePrerequisite:
        "Alert delivery often needs channel integrations configured under Integrations.",
    },
  },
  {
    prefix: "/help/billing-and-plans",
    entry: {
      whatIsThisPage:
        "Billing and plans — how evaluation and paid plans, usage, and invoices show up for architects.",
      whatToDoNext:
        "Open Billing settings for this workspace, or Pricing when you need public packaging before changing plans.",
      whyEmpty: "This guide is always available; live plan and usage cards appear after billing data loads.",
      whereToConfigurePrerequisite:
        "Changing plans or payment methods needs a role that can manage workspace billing.",
    },
  },
  {
    prefix: "/help/security-trust",
    entry: {
      whatIsThisPage:
        "Security and trust help — assurance ladder, data handling, subprocessors, and diligence materials for architects and buyers.",
      whatToDoNext:
        "Open Assurance status or Trust Center for live assurance surfaces, or Audit when you need governed trails.",
      whyEmpty: "This guide is always available; downloadable diligence packs appear on Trust Center when published.",
      whereToConfigurePrerequisite:
        "No configuration is required — this page is assurance orientation vocabulary only.",
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
    prefix: "/help/audit-trail",
    entry: {
      whatIsThisPage:
        "Audit trail help — how immutable audit events, correlation identifiers, and export posture support governed review.",
      whatToDoNext:
        "Open Audit for live activity, Findings when a concern needs triage, or Assurance status for assurance surfaces.",
      whyEmpty: "This guide is always available; live audit rows appear after workspace actions are recorded.",
      whereToConfigurePrerequisite:
        "Audit visibility follows workspace roles; confirm the header workspace before exporting trails.",
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
    prefix: "/help/findings",
    entry: {
      whatIsThisPage:
        "Findings — how architecture concerns are inspected, severity-ranked, and moved through governance resolution.",
      whatToDoNext:
        "Open the findings queue, search supporting evidence, or check the decision register for related outcomes.",
      whyEmpty: "This guide is always available; live findings appear after reviews produce architecture concerns.",
      whereToConfigurePrerequisite:
        "Findings respect the workspace and project selected in the header switcher.",
    },
  },
  {
    prefix: "/help/governance-approval",
    entry: {
      whatIsThisPage:
        "Governance approval — how architecture decisions move through submit, review, and finalize for architects.",
      whatToDoNext:
        "Open the approval queue or Workspace Health, then use Findings when you need the risk register behind a decision.",
      whyEmpty: "This guide is always available; live approval queues appear after reviews enter governance.",
      whereToConfigurePrerequisite:
        "Approval authority follows workspace roles; confirm the header workspace before acting on requests.",
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
    prefix: "/help/repeat-review-loop",
    entry: {
      whatIsThisPage:
        `${REPEAT_REVIEW_LOOP_HELP_INBOUND_LABEL} — compare packages, replay authority, and collect second-review proof after the first finalized review.`,
      whatToDoNext:
        "Open Compare two reviews, start the next review, or Validate review when you need live package trails.",
      whyEmpty: "This guide is always available; compare and replay surfaces populate after finalized reviews exist.",
      whereToConfigurePrerequisite:
        "Follow-up review workflows need at least one finalized architecture review in this workspace.",
    },
  },
  {
    prefix: "/help/pilot-guide",
    entry: {
      whatIsThisPage:
        "Pilot guide — how to prepare for a pilot, run the first architecture review, interpret outputs, and get support.",
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
        "Your first architecture review — guided path from evidence intake to a finalized package and sponsor-ready exports.",
      whatToDoNext:
        "Start an architecture review from the hero CTA, or open the sample review when you want a completed outcome first.",
      whyEmpty: "This guide is always available; live architecture reviews appear after you create them.",
      whereToConfigurePrerequisite:
        "Creating reviews needs a role that can start architecture reviews in this workspace.",
    },
  },
  {
    prefix: "/help/cloud-connections/azure",
    entry: {
      whatIsThisPage:
        "Connect Azure securely — workload identity federation, read-only roles, and validation without long-lived secrets.",
      whatToDoNext:
        "Follow the federation steps, then open the Azure cloud connection wizard to validate the attachment.",
      whyEmpty: "This guide is always available; live Azure connection status appears on the Cloud connections hub.",
      whereToConfigurePrerequisite:
        "Azure attachment is optional — evidence-only reviews work without a cloud connector.",
    },
  },
  {
    prefix: "/help/cloud-connections/aws",
    entry: {
      whatIsThisPage:
        "Connect AWS securely — OIDC-federated read-only IAM, Resource Explorer inventory, and validation without long-lived access keys.",
      whatToDoNext:
        "Follow the federation steps, then open the AWS cloud connection settings to validate the attachment.",
      whyEmpty: "This guide is always available; live AWS connection status appears on the Cloud connections hub.",
      whereToConfigurePrerequisite:
        "AWS attachment is optional — evidence-only reviews work without a cloud connector.",
      whatToDoNextAction: {
        label: "Open AWS connection settings",
        href: "/integrations/cloud-connections/aws",
      },
      whereToConfigureAction: {
        label: "Open Cloud connections help",
        href: "/help/cloud-connections",
      },
    },
  },
  {
    prefix: "/help/cloud-connections/gcp",
    entry: {
      whatIsThisPage:
        "Connect GCP securely — Workload Identity Federation, Cloud Asset Viewer, project scope, and validation without service-account JSON keys.",
      whatToDoNext:
        "Follow the federation steps, then open the GCP cloud connection settings to validate the attachment.",
      whyEmpty: "This guide is always available; live GCP connection status appears on the Cloud connections hub.",
      whereToConfigurePrerequisite:
        "GCP attachment is optional — evidence-only reviews work without a cloud connector.",
      whatToDoNextAction: {
        label: "Open GCP connection settings",
        href: "/integrations/cloud-connections/gcp",
      },
      whereToConfigureAction: {
        label: "Open Cloud connections help",
        href: "/help/cloud-connections",
      },
    },
  },
  {
    prefix: "/help/azure-permissions",
    entry: {
      whatIsThisPage:
        "Azure permissions — read-only roles, scopes, and verification steps for ArchLucid cloud connections.",
      whatToDoNext:
        "Open Cloud connections to configure Azure, or Connect Azure securely when you need the federation walkthrough.",
      whyEmpty: "This guide is always available; live permission checks appear after you configure an Azure connection.",
      whereToConfigurePrerequisite:
        "Assigning Azure roles needs cloud-admin authority in the target subscription.",
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
  {
    prefix: "/help/users-and-roles",
    entry: {
      whatIsThisPage:
        "Users and roles — ArchLucid app roles, capabilities, and how architects invite teammates for this workspace.",
      whatToDoNext:
        "Open Users settings to invite or assign roles, or Assurance status when you need assurance orientation.",
      whyEmpty: "This guide is always available; live directory rows appear after users are invited or provisioned.",
      whereToConfigurePrerequisite:
        "Managing users needs Admin authority; SSO may be required before invited users can sign in.",
    },
  },
  {
    prefix: "/help/cloud-connections",
    entry: {
      whatIsThisPage:
        "Cloud connections help — how optional Azure, AWS, and GCP connectors supply read-only evidence for reviews.",
      whatToDoNext:
        "Open the Cloud connections hub to configure a provider, or read Connect Azure securely for federation steps.",
      whyEmpty: "This guide is always available; live connection status appears on the Cloud connections hub.",
      whereToConfigurePrerequisite:
        "Cloud connectors are optional — evidence-only reviews work without attaching a cloud account.",
    },
  },
];
