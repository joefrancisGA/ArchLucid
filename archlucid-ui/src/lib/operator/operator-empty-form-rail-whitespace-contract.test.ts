import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { findOperatorEmptyFormRailWhitespaceViolations } from "@/lib/operator/operator-empty-form-rail-whitespace-patterns";
import {
  listOperatorEmptyFormRailWhitespaceMigratedEntries,
  OPERATOR_EMPTY_FORM_RAIL_WHITESPACE_INVENTORY,
} from "@/lib/operator/operator-empty-form-rail-whitespace-inventory";

const SRC_ROOT = join(process.cwd(), "src");

const REMEDIATION =
  "Empty form+rail surfaces must keep a compact first viewport (TB-1477–TB-1481 / TB-1482); "
  + "do not restore sparse helper-column voids or stacked empty theater.";

function readModuleSource(modulePath: string): string {
  return readFileSync(join(SRC_ROOT, modulePath), "utf8");
}

describe("operator empty form+rail whitespace (TB-1482)", () => {
  it("keeps a unique inventory keyed by surface id", () => {
    const ids = OPERATOR_EMPTY_FORM_RAIL_WHITESPACE_INVENTORY.map((entry) => entry.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(listOperatorEmptyFormRailWhitespaceMigratedEntries().length).toBeGreaterThanOrEqual(5);
  });

  it.each(
    listOperatorEmptyFormRailWhitespaceMigratedEntries().flatMap((entry) =>
      entry.modulePaths.map((modulePath) => [entry.id, modulePath, entry] as const),
    ),
  )("migrated surface %s module %s stays compact when empty", (id, modulePath, entry) => {
    const absolutePath = join(SRC_ROOT, modulePath);

    expect(existsSync(absolutePath), `${modulePath} must exist for ${id}`).toBe(true);

    const violations = findOperatorEmptyFormRailWhitespaceViolations(
      readModuleSource(modulePath),
      entry,
    );

    expect(
      violations.map((violation) => `${violation.code}: ${violation.message}`),
      `${id} (${modulePath}): ${REMEDIATION}`,
    ).toEqual([]);
  });
});
