/** Retired ≤~50 help alias rows folded into canonical specialty targets (TB-1414 inventory pass). */
export type SpecialtyHelpChromeRetiredBelow50InventoryEntry = {
  readonly approximateScore: number;
  readonly retiredHelpPath: string;
  readonly retiredSlug: string;
  readonly canonicalHelpPath: string;
  readonly canonicalSlug: string;
  readonly owningClusterId: string;
  readonly removedTrafficRowId: string;
  readonly closureNote: string;
};

/**
 * Historical scoreboard aliases only — not live inventory rows.
 * Traffic is scored on `canonicalHelpPath`. Retired bookmark paths no longer redirect (2026-08-13).
 */
export const SPECIALTY_HELP_CHROME_RETIRED_BELOW_50_INVENTORY: readonly SpecialtyHelpChromeRetiredBelow50InventoryEntry[] =
  [
    {
      approximateScore: 42,
      retiredHelpPath: "/help/evaluator-workbook",
      retiredSlug: "evaluator-workbook",
      canonicalHelpPath: "/help/choose-your-next-step",
      canonicalSlug: "choose-your-next-step",
      owningClusterId: "TB-1345",
      removedTrafficRowId: "HEE",
      closureNote: "Folded into path-chooser / choose-your-next-step specialty (HPX); Batch S 2026-08-11.",
    },
    {
      approximateScore: 46,
      retiredHelpPath: "/help/first-hour-operator-path",
      retiredSlug: "first-hour-operator-path",
      canonicalHelpPath: "/help/first-architecture-review",
      canonicalSlug: "first-architecture-review",
      owningClusterId: "TB-1374",
      removedTrafficRowId: "HFE",
      closureNote: "Folded into first-architecture-review specialty (COR); alias fold Done 2026-08-12.",
    },
  ] as const;
