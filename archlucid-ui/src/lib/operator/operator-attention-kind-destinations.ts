import { REVIEWS_HUB_UNFINISHED_WORK_HREF } from "@/lib/reviews-hub-unfinished-work-href";
import { GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  GOVERNANCE_NEEDS_ATTENTION_INBOX_PATH,
} from "@/lib/governance/governance-route-paths";
import type { OperatorAttentionKindId } from "@/lib/operator/operator-attention-taxonomy";

export type OperatorAttentionKindDestination = {
  readonly href: string;
  readonly description: string;
  readonly ctaLabel: string;
};

export const OPERATOR_ATTENTION_KIND_DESTINATIONS: Record<
  OperatorAttentionKindId,
  OperatorAttentionKindDestination
> = {
  "unfinished-work": {
    href: REVIEWS_HUB_UNFINISHED_WORK_HREF,
    description: "Reviews and packages that need your next action.",
    ctaLabel: "Open unfinished work",
  },
  "assigned-to-me": {
    href: GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
    description: "Open findings assigned to you for remediation.",
    ctaLabel: "Open assigned findings",
  },
  alerts: {
    href: GOVERNANCE_ALERTS_PATH,
    description: "Alerts that need acknowledgement or resolution.",
    ctaLabel: "Open alerts",
  },
  "awaiting-approval": {
    href: "/?tab=awaiting-approval",
    description:
      "Reviews waiting for governance approval before the sealed review record is finalized.",
    ctaLabel: "View awaiting approval",
  },
};

export const OPERATOR_NEEDS_ATTENTION_INBOX_HREF = GOVERNANCE_NEEDS_ATTENTION_INBOX_PATH;
