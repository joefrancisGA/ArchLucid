import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import { OPERATOR_CENTERED_EMPTY_STATE_BASELINE_PATHS } from "@/lib/operator/operator-centered-empty-state-baseline";
import { OPERATOR_OPERATOR_EMPTY_STATE_BASELINE_PATHS } from "@/lib/operator/operator-operator-empty-state-baseline";
import { listOperatorEmptyStateMigratedEntries } from "@/lib/operator/operator-empty-state-migration-inventory";

const SRC_ROOT = join(process.cwd(), "src");
const OPERATOR_ROOT = join(SRC_ROOT, "app", "(operator)");

const CENTERED_EMPTY_STATE_BASELINE: ReadonlySet<string> = new Set(
  OPERATOR_CENTERED_EMPTY_STATE_BASELINE_PATHS,
);

const OPERATOR_EMPTY_STATE_BASELINE: ReadonlySet<string> = new Set(
  OPERATOR_OPERATOR_EMPTY_STATE_BASELINE_PATHS,
);

const EMPTY_STATE_IMPORT_PATTERN = /from ["']@\/components\/EmptyState["']/;

const OPERATOR_SHELL_MESSAGE_IMPORT_PATTERN =
  /from ["']@\/components\/operator\/OperatorShellMessage["']/;

const COMPACT_EMPTY_STATE_PATTERN = /EnterpriseCompactEmptyState/;

function collectOperatorViews(directory: string): string[] {
  const collected: string[] = [];

  for (const entry of readdirSync(directory)) {
    const absolute = join(directory, entry);

    if (statSync(absolute).isDirectory()) {
      collected.push(...collectOperatorViews(absolute));
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

function usesCenteredEmptyState(absolute: string): boolean {
  const source = readFileSync(absolute, "utf8");

  if (!EMPTY_STATE_IMPORT_PATTERN.test(source)) {
    return false;
  }

  if (/import\s+type\s+[^;]*from ["']@\/components\/EmptyState["']/.test(source) && !/<EmptyState[\s/>]/.test(source)) {
    return false;
  }

  return /<EmptyState[\s/>]/.test(source);
}

function usesOperatorEmptyState(absolute: string): boolean {
  const source = readFileSync(absolute, "utf8");

  if (!OPERATOR_SHELL_MESSAGE_IMPORT_PATTERN.test(source)) {
    return false;
  }

  return /<OperatorEmptyState[\s/>]/.test(source);
}

describe("operator empty states (TB-1556)", () => {
  it("keeps centered EmptyState usage inside the frozen baseline", () => {
    const offenders = collectOperatorViews(OPERATOR_ROOT)
      .filter(usesCenteredEmptyState)
      .map(toPosixRelativePath)
      .filter((path) => !CENTERED_EMPTY_STATE_BASELINE.has(path))
      .sort();

    expect(offenders).toEqual([]);
  });

  it("does not carry baseline entries that already migrated off centered EmptyState", () => {
    const stale = [...CENTERED_EMPTY_STATE_BASELINE]
      .filter((path) => !usesCenteredEmptyState(join(SRC_ROOT, path)))
      .sort();

    expect(stale).toEqual([]);
  });

  it("keeps OperatorEmptyState usage inside the frozen baseline", () => {
    const offenders = collectOperatorViews(OPERATOR_ROOT)
      .filter(usesOperatorEmptyState)
      .map(toPosixRelativePath)
      .filter((path) => !OPERATOR_EMPTY_STATE_BASELINE.has(path))
      .sort();

    expect(offenders).toEqual([]);
  });

  it("does not carry OperatorEmptyState baseline entries that already migrated", () => {
    const stale = [...OPERATOR_EMPTY_STATE_BASELINE]
      .filter((path) => !usesOperatorEmptyState(join(SRC_ROOT, path)))
      .sort();

    expect(stale).toEqual([]);
  });

  it("uses EnterpriseCompactEmptyState in TB-1554 migrated inventory roots", () => {
    const missingCompact: string[] = [];

    for (const entry of listOperatorEmptyStateMigratedEntries()) {
      const absolutePath = join(SRC_ROOT, ...entry.componentOrModule.split("/"));

      if (!existsSync(absolutePath)) {
        missingCompact.push(`${entry.id}: missing file ${entry.componentOrModule}`);

        continue;
      }

      const source = readFileSync(absolutePath, "utf8");

      if (!COMPACT_EMPTY_STATE_PATTERN.test(source)) {
        missingCompact.push(`${entry.id}: ${entry.componentOrModule}`);
      }
    }

    expect(missingCompact).toEqual([]);
  });
});
