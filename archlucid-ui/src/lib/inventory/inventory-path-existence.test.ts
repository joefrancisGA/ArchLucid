import { describe, expect, it } from "vitest";

import {
  findMissingInventoryPaths,
  findStaleInventories,
  formatStaleInventories,
  resolveInventoryPath,
} from "@/lib/inventory/inventory-path-existence";
import type { InventoryPathSource } from "@/lib/inventory/inventory-path-source";

const PRESENT = "src/components/Present.tsx";

function existsOnlyForPresent(path: string): boolean {
  return path === PRESENT;
}

function source(overrides: Partial<InventoryPathSource>): InventoryPathSource {
  return {
    id: "SAMPLE_INVENTORY",
    module: "lib/sample-inventory.ts",
    base: "src",
    paths: [],
    ...overrides,
  };
}

describe("resolveInventoryPath", () => {
  it("anchors src-relative entries under src/", () => {
    expect(resolveInventoryPath("src", "components/Present.tsx")).toBe(PRESENT);
  });

  it("leaves ui-root entries untouched", () => {
    expect(resolveInventoryPath("ui-root", PRESENT)).toBe(PRESENT);
  });
});

describe("findMissingInventoryPaths", () => {
  it("returns nothing when every entry resolves", () => {
    const missing = findMissingInventoryPaths(
      source({ paths: ["components/Present.tsx"] }),
      existsOnlyForPresent,
    );

    expect(missing).toEqual([]);
  });

  it("reports resolved paths for entries that no longer exist", () => {
    const missing = findMissingInventoryPaths(
      source({ paths: ["components/Present.tsx", "components/Deleted.tsx"] }),
      existsOnlyForPresent,
    );

    expect(missing).toEqual(["src/components/Deleted.tsx"]);
  });

  it("reports a duplicated stale entry once", () => {
    const missing = findMissingInventoryPaths(
      source({ paths: ["components/Deleted.tsx", "components/Deleted.tsx"] }),
      existsOnlyForPresent,
    );

    expect(missing).toEqual(["src/components/Deleted.tsx"]);
  });

  it("honors the ui-root base", () => {
    const missing = findMissingInventoryPaths(
      source({ base: "ui-root", paths: [PRESENT, "src/components/Deleted.tsx"] }),
      existsOnlyForPresent,
    );

    expect(missing).toEqual(["src/components/Deleted.tsx"]);
  });

  it("rejects a missing source", () => {
    expect(() => findMissingInventoryPaths(null, existsOnlyForPresent)).toThrow(
      /Inventory path source is required/,
    );
  });
});

describe("findStaleInventories", () => {
  it("omits inventories whose entries all resolve", () => {
    const stale = findStaleInventories(
      [source({ paths: ["components/Present.tsx"] })],
      existsOnlyForPresent,
    );

    expect(stale).toEqual([]);
  });

  it("keeps only inventories with missing entries", () => {
    const stale = findStaleInventories(
      [
        source({ id: "CLEAN", paths: ["components/Present.tsx"] }),
        source({ id: "STALE", paths: ["components/Deleted.tsx"] }),
      ],
      existsOnlyForPresent,
    );

    expect(stale).toEqual([
      { id: "STALE", module: "lib/sample-inventory.ts", missing: ["src/components/Deleted.tsx"] },
    ]);
  });

  it("rejects missing sources", () => {
    expect(() => findStaleInventories(undefined, existsOnlyForPresent)).toThrow(
      /Inventory path sources are required/,
    );
  });
});

describe("formatStaleInventories", () => {
  it("names the declaring module and each stale entry", () => {
    const message = formatStaleInventories([
      { id: "STALE", module: "lib/sample-inventory.ts", missing: ["src/components/Deleted.tsx"] },
    ]);

    expect(message).toBe("STALE (lib/sample-inventory.ts):\n  - src/components/Deleted.tsx");
  });
});
