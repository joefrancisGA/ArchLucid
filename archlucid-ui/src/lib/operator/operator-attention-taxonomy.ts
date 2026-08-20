/**
 * TB-2353 — Four-kind attention taxonomy for home, nav, and review queues.
 */

export const OPERATOR_ATTENTION_KIND_IDS = [
  "unfinished-work",
  "assigned-to-me",
  "alerts",
  "awaiting-approval",
] as const;

export type OperatorAttentionKindId = (typeof OPERATOR_ATTENTION_KIND_IDS)[number];

export const OPERATOR_ATTENTION_KIND_LABELS: Record<OperatorAttentionKindId, string> = {
  "unfinished-work": "Unfinished work",
  "assigned-to-me": "Assigned to me",
  "alerts": "Alerts",
  "awaiting-approval": "Awaiting approval",
};

export type OperatorAttentionSurfaceId =
  | "unfinished-work-rail"
  | "governance-awaiting-nav-badge"
  | "assigned-to-me-findings"
  | "run-work-queue-needs-attention"
  | "stickiness-cockpit"
  | "alerts-nav"
  | "notifications-nav"
  | "digests-nav";

export const OPERATOR_ATTENTION_SURFACE_KIND_MAP: Record<
  OperatorAttentionSurfaceId,
  OperatorAttentionKindId
> = {
  "unfinished-work-rail": "unfinished-work",
  "governance-awaiting-nav-badge": "awaiting-approval",
  "assigned-to-me-findings": "assigned-to-me",
  "run-work-queue-needs-attention": "unfinished-work",
  "stickiness-cockpit": "unfinished-work",
  "alerts-nav": "alerts",
  "notifications-nav": "alerts",
  "digests-nav": "alerts",
};

export function operatorAttentionKindLabel(kind: OperatorAttentionKindId): string {
  return OPERATOR_ATTENTION_KIND_LABELS[kind];
}

export function operatorAttentionSurfaceInventory(): readonly {
  readonly surfaceId: OperatorAttentionSurfaceId;
  readonly kind: OperatorAttentionKindId;
  readonly kindLabel: string;
}[] {
  return (Object.entries(OPERATOR_ATTENTION_SURFACE_KIND_MAP) as Array<
    [OperatorAttentionSurfaceId, OperatorAttentionKindId]
  >).map(([surfaceId, kind]) => ({
    surfaceId,
    kind,
    kindLabel: OPERATOR_ATTENTION_KIND_LABELS[kind],
  }));
}
