import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { HELP_TOPIC_PERMANENT_REDIRECTS } from "@/lib/help-topic-permanent-redirects";

const CATALOG_PATH = join(process.cwd(), "..", "scripts", "ci", "archlucid_ui_route_catalog.py");

function parseWorkbookPathMigrations(pythonSource: string): Record<string, string> {
  const migrations: Record<string, string> = {};
  const blockMatch = pythonSource.match(/WORKBOOK_PATH_MIGRATIONS:\s*dict\[str,\s*str\]\s*=\s*\{([\s\S]*?)\n\}/);

  if (blockMatch === null) {
    throw new Error("Could not locate WORKBOOK_PATH_MIGRATIONS in archlucid_ui_route_catalog.py");
  }

  const entryPattern = /"([^"]+)":\s*"([^"]+)"/g;

  for (const match of blockMatch[1].matchAll(entryPattern)) {
    migrations[match[1]] = match[2];
  }

  return migrations;
}

function workbookTargetForPermanentRedirect(targetPath: string): string {
  const hashIndex = targetPath.indexOf("#");

  if (hashIndex === -1) {
    return targetPath;
  }

  return targetPath.slice(0, hashIndex);
}

describe("help-topic-permanent-redirect workbook parity (Batch T)", () => {
  const workbookMigrations = parseWorkbookPathMigrations(readFileSync(CATALOG_PATH, "utf8"));

  it.each(Object.entries(HELP_TOPIC_PERMANENT_REDIRECTS))(
    "maps retired /help/%s in Python WORKBOOK_PATH_MIGRATIONS",
    (slug, targetPath) => {
      const retiredPath = `/help/${slug}`;
      const expectedWorkbookTarget = workbookTargetForPermanentRedirect(targetPath);

      expect(workbookMigrations[retiredPath], retiredPath).toBe(expectedWorkbookTarget);
    },
  );
});
