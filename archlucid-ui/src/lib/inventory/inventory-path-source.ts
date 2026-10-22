/**
 * Shared shape for the hand-maintained module-path inventories scattered across `src/lib`
 * (migration trackers, grandfathered baselines, allowlists).
 *
 * These lists rot silently: when a module is renamed or deleted, the entry keeps sitting in the
 * inventory and the contract test that consumes it either throws `ENOENT` or quietly covers
 * nothing. Registering an inventory here lets one guard fail with a readable message instead.
 */

/**
 * Where an inventory's path strings are anchored. Both conventions exist in this app, so each
 * source declares its own base rather than the guard guessing from the first segment.
 */
export type InventoryPathBase = "src" | "ui-root";

export type InventoryPathSource = {
  /** Exported constant name, quoted verbatim in guard failures so the fix location is obvious. */
  readonly id: string;
  /** Declaring module, relative to `archlucid-ui/src`. */
  readonly module: string;
  readonly base: InventoryPathBase;
  readonly paths: readonly string[];
};

export type StaleInventory = {
  readonly id: string;
  readonly module: string;
  /** Entries that no longer resolve to a file, anchored to `archlucid-ui/`. */
  readonly missing: readonly string[];
};
