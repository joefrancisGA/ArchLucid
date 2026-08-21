/**
 * Buyer-safe contrast vs general LLM chat (TB-265), sourced from DIFFERENTIATION_PROOF_PACKET.md.
 */
export type MarketingGenericAiContrastPoint = {
  readonly label: string;
  readonly archlucid: string;
  readonly genericAi: string;
};

export const MARKETING_GENERIC_AI_CONTRAST_POINTS: readonly MarketingGenericAiContrastPoint[] = [
  {
    label: "Durable review artifact",
    archlucid: "Committed finalized review record in SQL with review record id and audit trail",
    genericAi: "Chat transcript — no durable review record tied to your tenant",
  },
  {
    label: "Governance before commit",
    archlucid: "Optional approval check blocks policy violations before the review record is canonical",
    genericAi: "No commit boundary — advice is not gated against your policy packs",
  },
  {
    label: "Evidence per finding",
    archlucid: "Evidence refs and explainability traces on structured findings",
    genericAi: "Hallucination risk without persisted evidence linkage",
  },
  {
    label: "Sponsor export",
    archlucid: "Repeatable sponsor packet and labeled ROI basis (buyer-provided / demo / not collected)",
    genericAi: "Copy-paste from a session — not a bounded export package",
  },
  {
    label: "Audit trail",
    archlucid: "Typed AuditEvents with correlation ids for mutating API work",
    genericAi: "No enterprise audit ledger for architecture review decisions",
  },
] as const;
