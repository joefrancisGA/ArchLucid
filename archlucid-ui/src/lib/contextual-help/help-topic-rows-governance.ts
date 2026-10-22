/** Governance, procurement, and assurance help topics (`/help/**`). */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { DATA_HANDLING_TENANT_ISOLATION_HELP_TOPIC_LABEL } from "@/lib/data-handling-tenant-isolation-help-evidence-copy";

export const HELP_TOPIC_CONTEXTUAL_HELP_ROWS_GOVERNANCE: readonly PageContextualHelpRow[] = [
  {
    prefix: "/help/data-handling",
    entry: {
      whatIsThisPage: `${DATA_HANDLING_TENANT_ISOLATION_HELP_TOPIC_LABEL} — review evidence flow, tenant scope, and three-layer isolation.`,
      whatToDoNext:
        "Open Trust Center or Assurance status for diligence artifacts, then review Sources before sponsor briefings.",
      whyEmpty: "This guide always shows isolation and data-handling content when the help topic loads.",
      whereToConfigurePrerequisite: "Confirm residency and subprocessors during procurement with your account team.",
      taskSteps: [
        "Review evidence flow and tenant scope vocabulary.",
        "Open Trust Center for diligence artifacts.",
        "Confirm Sources before sponsor briefings.",
      ],
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
      taskSteps: [
        "Open Trust Center for the diligence pack.",
        "Review Subprocessors with counsel.",
        "Expand the full template only for negotiation work.",
      ],
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
      taskSteps: [
        "Open Trust Center for the diligence pack.",
        "Use CAIQ or SIG for questionnaire pre-fills.",
        "Read the control summary as readiness mapping only.",
      ],
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
      taskSteps: [
        "Use questionnaire pre-fills with procurement counsel.",
        "Open SOC 2 self-assessment for related assurance context.",
        "Open Trust Center for published diligence packs.",
      ],
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
      taskSteps: [
        "Open Assurance status or Trust Center for public materials.",
        "Request NDA-gated packs through Security and Trust settings.",
        "Use the security mailbox when counsel needs direct contact.",
      ],
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
      taskSteps: [
        "Confirm tenant, workspace, and project in the header switcher.",
        "Open Users and roles when access needs adjustment.",
        "Open Users settings when invitations are required.",
      ],
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
      taskSteps: [
        "Open the live Evidence graph for relationship context.",
        "Use Search review evidence for workspace-wide retrieval.",
        "Open Validate review when you need package-level trails.",
      ],
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
      taskSteps: [
        "Open the alerts inbox for active notifications.",
        "Review Alert rules conditions and destinations.",
        "Configure integrations when delivery channels are missing.",
      ],
    },
  },
];
