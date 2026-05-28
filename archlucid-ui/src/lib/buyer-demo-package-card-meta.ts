import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";

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
    lastAuditEvent: "Governance approval recorded",
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
    decisionDate: "—",
    packageOwner: "Taylor Morgan",
    riskOwner: "—",
    approvalAuthority: "—",
    lastAuditEvent: "Review pipeline started",
  },
};

/** Demo portfolio rows — operational metadata for buyer review package cards. */
export function buyerDemoPackageCardMeta(runId: string): BuyerDemoPackageCardMeta | null {
  const key = canonicalizeDemoRunId(runId.trim());

  return DEMO_PACKAGE_CARD_META[key] ?? null;
}
