import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  findOperatorSideRailBannedKindMarkerViolations,
  findOperatorSideRailModuleViolations,
} from "@/lib/operator/operator-side-rail-patterns";
import { OPERATOR_SIDE_RAIL_INVENTORY } from "@/lib/operator/operator-side-rail-inventory";
import { listOperatorSideRailSurfaceModules } from "@/lib/operator/operator-side-rail-surface-modules";

const SRC_ROOT = join(process.cwd(), "src");
const OPERATOR_APP_ROOT = join(SRC_ROOT, "app", "(operator)");

const REMEDIATION =
  "Operator side rails must follow TB-1572–TB-1576: allowed kinds only on allowlisted surfaces, "
  + "no teaching/static/about-aside markers, and demoted hubs stay single-column.";

function readModuleSource(modulePath: string): string {
  return readFileSync(join(SRC_ROOT, modulePath), "utf8");
}

function collectOperatorTsxFiles(directory: string): string[] {
  const collected: string[] = [];

  for (const entry of readdirSync(directory)) {
    const absolute = join(directory, entry);

    if (statSync(absolute).isDirectory()) {
      collected.push(...collectOperatorTsxFiles(absolute));
      continue;
    }

    if (extname(absolute) === ".tsx" && !absolute.includes(".test.")) {
      collected.push(absolute);
    }
  }

  return collected;
}

describe("operator side-rail contract (TB-1576)", () => {
  it("maps every inventory row to at least one scanned module", () => {
    const missing = OPERATOR_SIDE_RAIL_INVENTORY.filter(
      (entry) => listOperatorSideRailSurfaceModules(entry).length === 0,
    ).map((entry) => entry.id);

    expect(missing, "Add module paths in operator-side-rail-surface-modules.ts").toEqual([]);
  });

  it("does not mount banned teaching/static/about-aside rail markers under app/(operator)", () => {
    const offenders = collectOperatorTsxFiles(OPERATOR_APP_ROOT)
      .map((absolute) => ({
        path: absolute.replace(`${SRC_ROOT}\\`, "").replace(`${SRC_ROOT}/`, "").split("\\").join("/"),
        violations: findOperatorSideRailBannedKindMarkerViolations(readFileSync(absolute, "utf8")),
      }))
      .filter((result) => result.violations.length > 0);

    expect(offenders, REMEDIATION).toEqual([]);
  });

  it.each(OPERATOR_SIDE_RAIL_INVENTORY.map((entry) => [entry.id, entry] as const))(
    "inventory surface %s stays on the side-rail contract",
    (id, entry) => {
      const modulePaths = listOperatorSideRailSurfaceModules(entry);
      const violations: string[] = [];

      for (const modulePath of modulePaths) {
        const absolutePath = join(SRC_ROOT, modulePath);

        if (!existsSync(absolutePath)) {
          violations.push(`${modulePath}: missing file`);
          continue;
        }

        const moduleViolations = findOperatorSideRailModuleViolations(readModuleSource(modulePath), {
          disposition: entry.disposition,
          kind: entry.kind,
        });

        for (const violation of moduleViolations) {
          violations.push(`${modulePath}: ${violation.code} — ${violation.message}`);
        }
      }

      expect(violations, `${id}: ${REMEDIATION}`).toEqual([]);
    },
  );
});
