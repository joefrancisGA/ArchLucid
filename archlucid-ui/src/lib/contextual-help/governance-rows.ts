/** Governance routes (`/governance/**`). */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";

export const GOVERNANCE_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: "/governance/decision-register",
    entry: {
      whatIsThisPage:
        "Browse architecture decisions locked with finalized review records — category, confidence, findings, and lineage.",
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
    prefix: "/governance/sealed-records",
    entry: {
      whatIsThisPage:
        "Finalized review record — the finalized package of decisions, findings, and downloadable artifacts for one architecture review.",
      whatToDoNext:
        "Review the summary and decisions, open related findings, or export the review bundle when downloads are ready.",
      whyEmpty: "A finalized review record appears after you finalize an architecture review.",
      whereToConfigurePrerequisite:
        "Finalize a review from the architecture review workspace before opening its finalized review record.",
    },
  },
];
