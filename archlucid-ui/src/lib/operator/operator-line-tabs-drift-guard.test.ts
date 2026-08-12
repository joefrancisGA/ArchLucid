import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  HAND_ROLLED_TABLIST_ALLOWED_PATHS,
  OPERATOR_LINE_TABS_ALLOWLIST,
  OPERATOR_LINE_TABS_GOLD_SURFACES,
  OPERATOR_LINE_TABS_PILL_DEFAULT_RESIDUAL,
  TABS_LIST_BANNED_CLASS_FRAGMENTS,
  TABS_TRIGGER_BANNED_CLASS_FRAGMENTS,
  findHandRolledTablistPaths,
  findOperatorLineTabsChromeViolations,
  operatorLineTabsModuleHasBannedListChrome,
  operatorLineTabsModuleHasBannedTriggerChrome,
  operatorLineTabsModuleUsesLineVariant,
  operatorLineTabsSurfacesByKind,
} from "@/lib/operator/operator-line-tabs-surfaces";

const SRC_ROOT = join(process.cwd(), "src");

function listTsxFiles(dir: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...listTsxFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

function readAllTsxSources(): ReadonlyMap<string, string> {
  const sources = new Map<string, string>();
  const normalizedRoot = SRC_ROOT.replace(/\\/g, "/");

  for (const absolutePath of listTsxFiles(SRC_ROOT)) {
    const relativePath = absolutePath.replace(/\\/g, "/").replace(`${normalizedRoot}/`, "");
    sources.set(relativePath, readFileSync(absolutePath, "utf8"));
  }

  return sources;
}

const CHROME_REMEDIATION =
  "TabsList/TabsTrigger may only add overflow helpers (whitespace-nowrap, shrink-0, scroll wrappers). "
  + "Pill, chip, folder-tab, and segmented-tray chrome is banned by TB-1661.";

const TABLIST_REMEDIATION =
  "Same-page panel switchers must use the shared Tabs primitive (components/ui/tabs.tsx); "
  + "cross-route switchers use <nav> + aria-current and in-panel 2-4 mode switches use segmented "
  + "aria-pressed (TB-1661 / TB-1664).";

describe("operator line-tabs drift guard (TB-1665)", () => {
  it("holds gold exemplars, migrated surfaces, and the pill residual in one allowlist", () => {
    const ids = OPERATOR_LINE_TABS_ALLOWLIST.map((entry) => entry.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(OPERATOR_LINE_TABS_GOLD_SURFACES.length).toBeGreaterThan(0);
  });

  it.each(
    operatorLineTabsSurfacesByKind("tabs-line").map((entry) => [entry.id, entry.modulePath]),
  )("%s declares variant=line", (_id, modulePath) => {
    const source = readFileSync(join(SRC_ROOT, modulePath), "utf8");

    expect(operatorLineTabsModuleUsesLineVariant(source), `${modulePath} must set variant="line"`).toBe(
      true,
    );
  });

  it.each(
    OPERATOR_LINE_TABS_ALLOWLIST.filter((entry) => entry.kind !== "sections-no-tabs").map((entry) => [
      entry.id,
      entry.modulePath,
    ]),
  )("%s applies no banned tab chrome", (_id, modulePath) => {
    const source = readFileSync(join(SRC_ROOT, modulePath), "utf8");

    expect(operatorLineTabsModuleHasBannedListChrome(source), CHROME_REMEDIATION).toEqual([]);
    expect(operatorLineTabsModuleHasBannedTriggerChrome(source), CHROME_REMEDIATION).toEqual([]);
  });

  it("pins the surfaces still inheriting the legacy pill default", () => {
    const residualIds = OPERATOR_LINE_TABS_PILL_DEFAULT_RESIDUAL.map((entry) => entry.id).sort();

    // Shrinks to [] when the primitive default flips to line (or each call site opts in).
    expect(residualIds).toEqual([
      "architecture-created-workspace",
      "digests-hub",
      "graph-presentation",
      "help-azure-permissions-setup",
      "policy-packs",
      "reviews-new-path-switcher",
      "settings-roles",
    ]);
  });

  it.each(
    OPERATOR_LINE_TABS_PILL_DEFAULT_RESIDUAL.map((entry) => [entry.id, entry.modulePath]),
  )("%s inherits the default rather than overriding chrome", (_id, modulePath) => {
    const source = readFileSync(join(SRC_ROOT, modulePath), "utf8");

    expect(operatorLineTabsModuleUsesLineVariant(source)).toBe(false);
  });

  it("no source under src/ applies banned tab chrome", () => {
    const violations = findOperatorLineTabsChromeViolations(readAllTsxSources());

    expect(violations, CHROME_REMEDIATION).toEqual([]);
  });

  it("no source outside the shared primitive hand-rolls a tablist", () => {
    const offenders = findHandRolledTablistPaths(readAllTsxSources());

    expect(offenders, TABLIST_REMEDIATION).toEqual([]);
  });

  it("keeps the shared Tabs primitive as the only allowed tablist owner", () => {
    expect([...HAND_ROLLED_TABLIST_ALLOWED_PATHS]).toEqual(["components/ui/tabs.tsx"]);
  });
});

describe("operator line-tabs banned chrome detection (unit)", () => {
  it("flags pill triggers and tray lists", () => {
    const pill = '<TabsTrigger value="a" className="rounded-full px-3">A</TabsTrigger>';
    const tray = '<TabsList className="rounded-md border bg-white">x</TabsList>';

    expect(operatorLineTabsModuleHasBannedTriggerChrome(pill)).toContain("rounded-full");
    expect(operatorLineTabsModuleHasBannedListChrome(tray)).toContain("rounded-md border");
  });

  it("flags border-0 that removes the list underline", () => {
    const stripped = '<TabsList className="border-0 gap-2">x</TabsList>';

    expect(operatorLineTabsModuleHasBannedListChrome(stripped)).toContain("border-0");
  });

  it("allows overflow helpers", () => {
    const allowed =
      '<TabsList className="-mb-px overflow-x-auto"><TabsTrigger value="a" className="shrink-0">A</TabsTrigger></TabsList>';

    expect(operatorLineTabsModuleHasBannedListChrome(allowed)).toEqual([]);
    expect(operatorLineTabsModuleHasBannedTriggerChrome(allowed)).toEqual([]);
  });

  it("does not attribute a later element's classes to a tab strip", () => {
    const source = '<TabsList aria-label="x">y</TabsList>\n<div className="rounded-full" />';

    expect(operatorLineTabsModuleHasBannedListChrome(source)).toEqual([]);
  });

  it("ignores > inside JSX expressions when reading a trigger tag", () => {
    const source =
      '<TabsTrigger value="a" disabled={items.length > 0} className="shrink-0">A</TabsTrigger>';

    expect(operatorLineTabsModuleHasBannedTriggerChrome(source)).toEqual([]);
  });

  it("documents the ban lists", () => {
    expect(TABS_LIST_BANNED_CLASS_FRAGMENTS).toContain("rounded-full");
    expect(TABS_TRIGGER_BANNED_CLASS_FRAGMENTS).toContain("rounded-md");
  });
});
