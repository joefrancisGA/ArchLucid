import {
  BUYER_DEMO_ARCHITECTURE_REVIEW_LEAD,
  BUYER_DEMO_GOVERNANCE_APPROVER,
  BUYER_DEMO_REVIEW_OWNER_ROLE,
} from "@/lib/buyer/buyer-demo-persona-labels";
import {
  BUYER_CTO_DEMO_SHOWCASE_ANCHOR_ISO,
  formatDemoRelativeTimestamp,
} from "@/lib/buyer/buyer-cto-demo-orchestration";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export type BuyerDemoPackageCardMeta = {
  readonly decisionSummary: string;
  readonly decisionDate: string;
  readonly packageOwner: string;
  readonly riskOwner: string;
  readonly approvalAuthority: string;
  readonly lastAuditEvent: string;
};

const DEMO_PACKAGE_CARD_META: Readonly<Record<string, BuyerDemoPackageCardMeta>> = {
  [SHOWCASE_STATIC_DEMO_RUN_ID]: {
    decisionSummary: "Approved with monitoring · 1 monitored risk · 0 blocking issues",
    decisionDate: "Jan 14, 2026",
    packageOwner: "Taylor Morgan",
    riskOwner: "Taylor Morgan",
    approvalAuthority: "Jordan Lee (Architecture approver)",
    lastAuditEvent: "Resolve outcomes recorded",
  },
  "claims-intake-pending-governance-002": {
    decisionSummary: "Governance approval in progress · 2 findings under active review",
    decisionDate: "Jan 20, 2026",
    packageOwner: "Taylor Morgan",
    riskOwner: "Taylor Morgan",
    approvalAuthority: "Jordan Lee (Architecture approver)",
    lastAuditEvent: "Approval request submitted",
  },
  "claims-intake-in-progress-003": {
    decisionSummary: "In progress · findings and manifest not finalized",
    decisionDate: " — ",
    packageOwner: "Taylor Morgan",
    riskOwner: " — ",
    approvalAuthority: " — ",
    lastAuditEvent: "Review pipeline started",
  },
};

function withBuyerSafeActors(meta: BuyerDemoPackageCardMeta): BuyerDemoPackageCardMeta {
  const decisionAnchor = new Date(BUYER_CTO_DEMO_SHOWCASE_ANCHOR_ISO);
  const decisionEventIso = new Date(decisionAnchor.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

  return {
    ...meta,
    packageOwner: BUYER_DEMO_ARCHITECTURE_REVIEW_LEAD,
    riskOwner: BUYER_DEMO_REVIEW_OWNER_ROLE,
    approvalAuthority: BUYER_DEMO_GOVERNANCE_APPROVER,
    decisionDate: formatDemoRelativeTimestamp(decisionEventIso, decisionAnchor),
  };
}

/** Demo portfolio rows — operational metadata for buyer review cards. */
export function buyerDemoPackageCardMeta(runId: string): BuyerDemoPackageCardMeta | null {
  const key = canonicalizeDemoRunId(runId.trim());
  const meta = DEMO_PACKAGE_CARD_META[key] ?? null;

  if (meta === null) {
    return null;
  }

  if (isBuyerPolishedOperatorShellEnv()) {
    return withBuyerSafeActors(meta);
  }

  return meta;
}
