/**
 * TB-1482 — Operator empty form+rail whitespace inventory.
 *
 * Hardens **TB-1477**–**TB-1481** exemplars so sparse two-column helper rails and
 * below-fold empty theater do not regrow on migrated surfaces.
 *
 * Extend this table when shipping another whitespace P0; set `migrated: true` only
 * after the surface meets the contract in `operator-empty-form-rail-whitespace-patterns.ts`.
 */

export type OperatorEmptyFormRailWhitespaceEntry = {
  readonly id: string;
  readonly modulePaths: readonly string[];
  readonly migrated: boolean;
  readonly notes: string;
};

export const OPERATOR_EMPTY_FORM_RAIL_WHITESPACE_INVENTORY: readonly OperatorEmptyFormRailWhitespaceEntry[] =
  [
    {
      id: "recurrence-schedules",
      modulePaths: ["components/governance/RecurrenceSchedulesClient.tsx"],
      migrated: true,
      notes: "Done **TB-1133** — empty hides teaching helper; `data-empty-composition` on page root.",
    },
    {
      id: "advisory-schedules",
      modulePaths: ["components/advisory/AdvisorySchedulesContent.tsx"],
      migrated: true,
      notes: "Done **TB-1477** — compact empty under create form; no legacy scope-rail xl grid.",
    },
    {
      id: "digests-schedule",
      modulePaths: ["components/digests/ExecDigestScheduleContent.tsx"],
      migrated: true,
      notes: "Done **TB-1478** — live readiness rail pins only when `pinLivePreviewRail` is true.",
    },
    {
      id: "alert-rules-rules-tab",
      modulePaths: ["components/alerts/AlertRulesContent.tsx"],
      migrated: false,
      notes: "Open **TB-1479** — empty Rules tab still stacks list+create+preview voids.",
    },
    {
      id: "digests-browse",
      modulePaths: ["components/digests/DigestsBrowseContent.tsx"],
      migrated: true,
      notes: "Done **TB-1480** — one checklist story; includes preview behind disclosure.",
    },
    {
      id: "alert-routing",
      modulePaths: ["components/alerts/AlertRoutingContent.tsx"],
      migrated: true,
      notes: "Done **TB-1481** — empty composition uses compact `space-y-4` rhythm.",
    },
  ] as const;

export function listOperatorEmptyFormRailWhitespaceMigratedEntries(): readonly OperatorEmptyFormRailWhitespaceEntry[] {
  return OPERATOR_EMPTY_FORM_RAIL_WHITESPACE_INVENTORY.filter((entry) => entry.migrated);
}
