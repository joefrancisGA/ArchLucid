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

export const BUYER_DEMO_DECISION_DATE_NOT_STORED = "Decision date was not stored." as const;

export const BUYER_DEMO_RISK_OWNER_NOT_STORED = "Risk owner was not stored." as const;

export const BUYER_DEMO_APPROVAL_AUTHORITY_NOT_STORED = "Approval authority was not stored." as const;

export const BUYER_DEMO_PACKAGE_OWNER_NOT_STORED = "Package owner was not stored." as const;

const DEMO_PACKAGE_CARD_META: Readonly<Record<string, BuyerDemoPackageCardMeta>> = {
  [SHOWCASE_STATIC_DEMO_RUN_ID]: {
    decisionSummary: "Approved with monitoring · 1 monitored risk · 0 blocking issues",
    decisionDate: "Jan 14, 2026",
    packageOwner: "Taylor Morgan",
    riskOwner: "Taylor Morgan",
    approvalAuthority: "Jordan Lee (Architecture approver)",
    lastAuditEvent: "Approval recorded",
  },
  "claims-intake-pending-governance-002": {
    decisionSummary: "Approval in progress · 2 findings under active review",
    decisionDate: "Jan 20, 2026",
    packageOwner: "Taylor Morgan",
    riskOwner: "Taylor Morgan",
    approvalAuthority: "Jordan Lee (Architecture approver)",
    lastAuditEvent: "Approval request submitted",
  },
  "claims-intake-in-progress-003": {
    decisionSummary: "In progress · findings and manifest not finalized",
    decisionDate: BUYER_DEMO_DECISION_DATE_NOT_STORED,
    packageOwner: BUYER_DEMO_PACKAGE_OWNER_NOT_STORED,
    riskOwner: BUYER_DEMO_RISK_OWNER_NOT_STORED,
    approvalAuthority: BUYER_DEMO_APPROVAL_AUTHORITY_NOT_STORED,
    lastAuditEvent: "Review pipeline started",
  },
};

function decisionDateWasStored(decisionDate: string): boolean {
  const trimmed = decisionDate.trim();

  return (
    trimmed.length > 0
    && trimmed !== BUYER_DEMO_DECISION_DATE_NOT_STORED
    && trimmed.toLowerCase() !== "not recorded"
  );
}

function withBuyerSafeActors(meta: BuyerDemoPackageCardMeta): BuyerDemoPackageCardMeta {
  if (!decisionDateWasStored(meta.decisionDate)) {
    return {
      ...meta,
      decisionDate: BUYER_DEMO_DECISION_DATE_NOT_STORED,
    };
  }

  return meta;
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
