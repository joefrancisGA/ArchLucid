/** Approval lineage surface (`/governance/approval-requests/**`). */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { APPROVAL_LINEAGE_HELP_TOPIC_LABEL } from "@/lib/approval-lineage-evidence-copy";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";

export const APPROVAL_LINEAGE_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: "/governance/approval-requests",
    entry: {
      whatIsThisPage:
        `Approval lineage — inspect how an approval request links to its review, findings, risk posture, and finalized review record version (${APPROVAL_LINEAGE_HELP_TOPIC_LABEL.toLowerCase()}).`,
      whatToDoNext:
        "Open the linked review or findings, return to the approval queue, or check Audit when you need the activity trail.",
      whyEmpty: "Lineage appears after an approval request exists for a finalized architecture review.",
      whereToConfigurePrerequisite:
        "Submit or open an approval from the approval queue after a review is ready for decision.",
      whatToDoNextAction: {
        label: "Open approval queue",
        href: GOVERNANCE_APPROVAL_QUEUE_PATH,
      },
    },
  },
];

