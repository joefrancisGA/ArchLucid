/** Governance hub and governance-approval help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  GOVERNANCE_APPROVAL_HELP_CANONICAL_PATH,
  GOVERNANCE_APPROVAL_HELP_TOPIC_LABEL,
} from "@/lib/governance/governance-approval-help-evidence-copy";

export const GOVERNANCE_APPROVAL_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: "/governance",
    entry: {
      whatIsThisPage:
        `Governance — ${GOVERNANCE_APPROVAL_HELP_TOPIC_LABEL.toLowerCase()} across findings, approvals, audit, and policy configuration.`,
      whatToDoNext:
        "Open the approval queue, findings register, or approval setup when you need live decisions or configuration.",
      whyEmpty: "Governance surfaces populate after reviews produce findings, decisions, or approval requests.",
      whereToConfigurePrerequisite:
        "Approval setup links policy, alerts, and approval expectations before day-to-day operations.",
      whatToDoNextAction: {
        label: "Open approval queue",
        href: "/governance/approval-queue",
      },
      whereToConfigureAction: {
        label: "Open approval setup",
        href: "/governance/setup",
      },
    },
  },
  {
    prefix: GOVERNANCE_APPROVAL_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage:
        `Resolve outcomes — ${GOVERNANCE_APPROVAL_HELP_TOPIC_LABEL.toLowerCase()} across submit, review, and finalize for architects.`,
      whatToDoNext:
        "Open the approval queue or Workspace Health, then use Findings when you need the risk register behind a decision.",
      whyEmpty: "This guide is always available; live approval queues appear after reviews enter governance.",
      whereToConfigurePrerequisite:
        "Approval authority follows workspace roles; confirm the header workspace before acting on requests.",
      whatToDoNextAction: {
        label: "Open approval queue",
        href: "/governance/approval-queue",
      },
      whereToConfigureAction: {
        label: "Open approval setup",
        href: "/governance/setup",
      },
    },
  },
];

