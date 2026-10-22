import type { InventoryPathBase, InventoryPathSource, StaleInventory } from "@/lib/inventory/inventory-path-source";

/**
 * Answers whether a path anchored at `archlucid-ui/` exists. Injected rather than importing
 * `node:fs` here so this module stays usable from any environment and testable without a disk.
 */
export type InventoryPathExists = (uiRootRelativePath: string) => boolean;

/** Normalizes one inventory entry to a path relative to `archlucid-ui/`. */
export function resolveInventoryPath(base: InventoryPathBase, entry: string): string {
  switch (base) {
    case "src":
      return `src/${entry}`;
    case "ui-root":
      return entry;
    default: {
      const unhandled: never = base;

      throw new Error(`Unhandled inventory path base: ${String(unhandled)}`);
    }
  }
}

/** Entries of one inventory that no longer resolve to a file, anchored to `archlucid-ui/`. */
export function findMissingInventoryPaths(
  source: InventoryPathSource | null | undefined,
  exists: InventoryPathExists,
): readonly string[] {
  if (source === null || source === undefined) {
    throw new Error("Inventory path source is required.");
  }

  const seen = new Set<string>();

  return source.paths
    .map((entry) => resolveInventoryPath(source.base, entry))
    .filter((resolved) => {
      // A duplicated entry would otherwise be reported twice for the same underlying file.
      if (seen.has(resolved)) {
        return false;
      }

      seen.add(resolved);

      return !exists(resolved);
    });
}

/** Every registered inventory that still points at a missing module. */
export function findStaleInventories(
  sources: readonly InventoryPathSource[] | null | undefined,
  exists: InventoryPathExists,
): readonly StaleInventory[] {
  if (sources === null || sources === undefined) {
    throw new Error("Inventory path sources are required.");
  }

  return sources
    .map((source) => ({
      id: source.id,
      module: source.module,
      missing: findMissingInventoryPaths(source, exists),
    }))
    .filter((candidate) => candidate.missing.length > 0);
}

/** Failure text listing each stale inventory and the entries to delete or repoint. */
export function formatStaleInventories(stale: readonly StaleInventory[]): string {
  return stale
    .map((entry) => `${entry.id} (${entry.module}):\n  - ${entry.missing.join("\n  - ")}`)
    .join("\n");
}
