/** Governance approval queue surface. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  APPROVAL_QUEUE_CANONICAL_PATH,
  APPROVAL_QUEUE_HELP_TOPIC_LABEL,
} from "@/lib/approval-queue-evidence-copy";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";

export const APPROVAL_QUEUE_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: APPROVAL_QUEUE_CANONICAL_PATH,
    entry: {
      whatIsThisPage:
        `Governance approval queue — submit, approve, or reject architecture-review decisions for this workspace (${APPROVAL_QUEUE_HELP_TOPIC_LABEL.toLowerCase()}).`,
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
];
