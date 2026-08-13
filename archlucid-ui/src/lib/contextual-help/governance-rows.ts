/** Governance routes (`/governance/**`). */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_WORKSPACE_HEALTH_HREF,
} from "@/lib/governance/governance-route-paths";

export const GOVERNANCE_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: "/governance/policy-packs",
    entry: {
      whatIsThisPage:
        "Review policy pack rules, versions, and how packs apply to architecture reviews in this workspace.",
      whatToDoNext:
        "Open a pack to inspect rules, return to the library to compare packs, or apply a pack when starting a review.",
      whyEmpty: "Packs appear after the library is populated for this workspace.",
      whereToConfigurePrerequisite:
        "Policy packs respect the workspace and project selected in the header switcher.",
    },
  },
  {
    prefix: "/governance/decision-register",
    entry: {
      whatIsThisPage:
        "Browse architecture decisions locked with signed review records — category, confidence, findings, and lineage.",
      whatToDoNext:
        "Filter by date or category, open a decision card, then follow the linked review or findings when needed.",
      whyEmpty: "Decisions appear after reviews are signed with recorded architecture decisions.",
      whereToConfigurePrerequisite:
        "Decision register respects the workspace and project selected in the header switcher.",
      whatToDoNextAction: {
        label: "Open architecture reviews",
        href: REVIEWS_LIST_PATH,
      },
    },
  },
  {
    prefix: "/governance/audit",
    entry: {
      whatIsThisPage:
        "Search and export workspace audit events for reviews, governance actions, and integrity checks in this workspace.",
      whatToDoNext:
        "Filter by review or action, refresh the trail, then export or open the related architecture review when needed.",
      whyEmpty: "Events appear after architects take actions that the audit coverage matrix records.",
      whereToConfigurePrerequisite:
        "Audit retention and export privileges follow workspace role and enterprise controls.",
    },
  },
  {
    prefix: "/governance/advisory-scans",
    entry: {
      whatIsThisPage: "Generate prioritized follow-up recommendations from finalized reviews.",
      whatToDoNext: "Select a finalized review and generate a scan, or open Schedules for recurring runs.",
      whyEmpty: "Scans appear after you generate one from a finalized review.",
      whereToConfigurePrerequisite:
        "Finalize a review first; optional baseline comparison highlights drift.",
      whatToDoNextAction: {
        label: "Open Schedules tab",
        href: ADVISORY_SCANS_SCHEDULES_HREF,
      },
      whereToConfigureAction: {
        label: "Open architecture reviews",
        href: REVIEWS_LIST_PATH,
      },
    },
  },
  {
    prefix: "/governance/alert-rules",
    entry: {
      whatIsThisPage:
        "Configure when completed reviews raise alerts, where notifications are delivered, advanced composite rules, and simulation tests.",
      whatToDoNext:
        "Set Conditions first, then open Notifications to add destinations, or use Test alerts to simulate behavior.",
      whyEmpty: "Rules and destinations appear after you create them for this workspace.",
      whereToConfigurePrerequisite:
        "Alert delivery often needs channel integrations (email, Teams, Slack, or webhooks) configured under Integrations.",
    },
  },
  {
    prefix: "/governance/approval-queue",
    entry: {
      whatIsThisPage:
        "Governance approval queue — submit, approve, or reject architecture-review decisions for this workspace.",
      whatToDoNext:
        "Load a review context, submit an approval request when ready, then approve or reject with an audit-friendly comment.",
      whyEmpty: "Pending requests appear after a finalized architecture review is submitted for governance decision.",
      whereToConfigurePrerequisite:
        "Open Findings or Workspace health when you need triage or KPI context before deciding.",
      whatToDoNextAction: {
        label: "Open findings",
        href: "/governance/findings",
      },
      whereToConfigureAction: {
        label: "Open workspace health",
        href: GOVERNANCE_WORKSPACE_HEALTH_HREF,
      },
    },
  },
  {
    prefix: "/governance/approval-requests",
    entry: {
      whatIsThisPage:
        "Approval lineage — inspect how an approval request links to its review, findings, risk posture, and signed-record version.",
      whatToDoNext:
        "Open the linked review or findings, return to the approval queue, or check Audit when you need the activity trail.",
      whyEmpty: "Lineage appears after an approval request exists for a finalized architecture review.",
      whereToConfigurePrerequisite:
        "Submit or open an approval from the governance approval queue after a review is ready for decision.",
      whatToDoNextAction: {
        label: "Open approval queue",
        href: GOVERNANCE_APPROVAL_QUEUE_PATH,
      },
    },
  },
  {
    prefix: "/governance/signed-records",
    entry: {
      whatIsThisPage:
        "Signed review record — the finalized package of decisions, findings, and downloadable artifacts for one architecture review.",
      whatToDoNext:
        "Review the summary and decisions, open related findings, or export the review bundle when downloads are ready.",
      whyEmpty: "A signed review record appears after you finalize an architecture review.",
      whereToConfigurePrerequisite:
        "Finalize a review from the architecture review workspace before opening its signed record.",
    },
  },
];
