import { OPERATOR_DATA_TABLE_RAW_TABLE_BASELINE_PATHS } from "@/lib/operator/operator-data-table-raw-table-baseline";

/**
 * TB-1649 — Operator populated-list honesty + action-budget inventory.
 *
 * Contract: `docs/library/UI_DESIGN_SYSTEM.md` § Operator populated lists (**TB-1646**).
 * Raw-table ratchet: `operator-data-table-contract.test.ts` (**TB-2382**).
 * Vitest follow-on: **TB-1650**.
 */

export type OperatorPopulatedListKind =
  | "inventory"
  | "master-detail"
  | "entity-summary"
  | "config-checklist"
  | "scale-table";

export type OperatorPopulatedListMigrateDisposition =
  | "enterprise-table-native"
  | "honesty-action-budget-done"
  | "raw-table-pending"
  | "scale-table-justified";

export type OperatorPopulatedListMigrateEntry = {
  readonly id: string;
  readonly pathOrSurface: string;
  readonly kind: OperatorPopulatedListKind;
  readonly disposition: OperatorPopulatedListMigrateDisposition;
  readonly componentOrModule: string;
  readonly maxVisibleRowActions: number;
  readonly notes: string;
};

export const OPERATOR_POPULATED_LIST_MIGRATE_INVENTORY: readonly OperatorPopulatedListMigrateEntry[] = [
  {
    id: "recurrence-schedules-inventory",
    pathOrSurface: "/governance/recurrence",
    kind: "inventory",
    disposition: "honesty-action-budget-done",
    componentOrModule: "components/governance/RecurrenceSchedulesClient.tsx",
    maxVisibleRowActions: 2,
    notes: "Buyer scope link + cadence disclosure; View/Toggle primary; Edit in More actions (**TB-1649**).",
  },
  {
    id: "digest-subscriptions-inventory",
    pathOrSurface: "/architecture/digests?tab=subscriptions",
    kind: "inventory",
    disposition: "honesty-action-budget-done",
    componentOrModule: "components/digests/DigestSubscriptionList.tsx",
    maxVisibleRowActions: 2,
    notes: "Pause/Toggle primary; Edit/Send test/History in More actions; disabled Delete removed (**TB-1649**).",
  },
  {
    id: "reviews-hub-run-status",
    pathOrSurface: "/architecture/reviews",
    kind: "inventory",
    disposition: "honesty-action-budget-done",
    componentOrModule: "components/runs/RunStatusBadge.tsx",
    maxVisibleRowActions: 0,
    notes: "Reviews list uses StatusTag pipeline vocabulary instead of StatusPill (**TB-1649**).",
  },
  ...OPERATOR_DATA_TABLE_RAW_TABLE_BASELINE_PATHS.map(
    (componentOrModule): OperatorPopulatedListMigrateEntry => ({
      id: `raw-table-${componentOrModule.replace(/[^\w]+/g, "-").toLowerCase()}`,
      pathOrSurface: componentOrModule,
      kind: "inventory",
      disposition: "raw-table-pending",
      componentOrModule,
      maxVisibleRowActions: 2,
      notes: "Raw HTML table — migrate to EnterpriseTable under **TB-1650** / **TB-2382** ratchet.",
    }),
  ),
];

export function operatorPopulatedListInventoryByDisposition(
  disposition: OperatorPopulatedListMigrateDisposition,
): readonly OperatorPopulatedListMigrateEntry[] {
  return OPERATOR_POPULATED_LIST_MIGRATE_INVENTORY.filter((entry) => entry.disposition === disposition);
}

export function operatorPopulatedListMaxVisibleRowActions(entryId: string): number {
  const entry = OPERATOR_POPULATED_LIST_MIGRATE_INVENTORY.find((row) => row.id === entryId);

  if (entry === undefined) {
    return 2;
  }

  return entry.maxVisibleRowActions;
}
