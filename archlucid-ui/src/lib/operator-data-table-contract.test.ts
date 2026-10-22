import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

import { OPERATOR_DATA_TABLE_RAW_TABLE_BASELINE_PATHS } from "@/lib/operator/operator-data-table-raw-table-baseline";

/**
 * Marketing pages, help guides, and the static reference tables they embed are prose documents,
 * not operator data grids, so they are outside the EnterpriseTable convention.
 */
const EXEMPT_PREFIXES: readonly string[] = [
  "app/(marketing)/",
  "app/(operator)/help/",
  "components/help/",
  "components/marketing/",
];

/**
 * Operator surfaces still rendering raw `<table>` markup (TB-2382 ratchet baseline).
 *
 * `EnterpriseTable` owns the scroll shell, header-row treatment, cell padding, and row borders.
 * Hand-rolled tables re-derive those per surface — the fleet COGS grid used `py-2 pr-4` cells and
 * `border-neutral-100` rows against the shared `border-neutral-200`. This list may shrink but must
 * never grow.
 */
const RAW_TABLE_BASELINE: ReadonlySet<string> = new Set(OPERATOR_DATA_TABLE_RAW_TABLE_BASELINE_PATHS);

function collectComponentFiles(directory: string): string[] {
  const collected: string[] = [];

  for (const entry of readdirSync(directory)) {
    const absolute = join(directory, entry);

    if (statSync(absolute).isDirectory()) {
      collected.push(...collectComponentFiles(absolute));
      continue;
    }

    if (extname(absolute) === ".tsx" && !absolute.includes(".test.")) {
      collected.push(absolute);
    }
  }

  return collected;
}

function toPosixRelativePath(absolute: string): string {
  return relative(SRC_ROOT, absolute).split("\\").join("/");
}

function rendersRawTable(absolute: string): boolean {
  const source = readFileSync(absolute, "utf8");

  return /<table[\s>]/.test(source) && !/EnterpriseTable\b/.test(source);
}

describe("operator data tables (TB-2382)", () => {
  it("keeps raw table markup inside the frozen baseline", () => {
    const offenders = collectComponentFiles(SRC_ROOT)
      .filter(rendersRawTable)
      .map(toPosixRelativePath)
      .filter((path) => !EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix)))
      .filter((path) => !RAW_TABLE_BASELINE.has(path))
      .sort();

    expect(offenders).toEqual([]);
  });

  it("does not carry baseline entries that were already migrated", () => {
    const stale = [...RAW_TABLE_BASELINE]
      .filter((path) => !rendersRawTable(join(SRC_ROOT, path)))
      .sort();

    expect(stale).toEqual([]);
  });
});
