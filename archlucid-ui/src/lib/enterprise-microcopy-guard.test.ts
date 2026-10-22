import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { BUYER_SCOPE_SWITCHER_CLOSE } from "@/lib/buyer/buyer-polish-copy";

const SRC_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CASUAL_GOT_IT_PATTERN = /["'`]Got it["'`]/i;

function listSourceFiles(directory: string): string[] {
  const entries = readdirSync(directory);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...listSourceFiles(fullPath));

      continue;
    }

    if (!/\.(ts|tsx)$/.test(entry)) {
      continue;
    }

    if (/\.(test|spec)\.(ts|tsx)$/.test(entry)) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

describe("enterprise microcopy guard", () => {
  it("does not ship casual Got it labels in user-facing UI source", () => {
    const offenders = listSourceFiles(SRC_ROOT).flatMap((filePath) => {
      const text = readFileSync(filePath, "utf8");

      if (!CASUAL_GOT_IT_PATTERN.test(text)) {
        return [];
      }

      return [path.relative(SRC_ROOT, filePath)];
    });

    expect(offenders).toEqual([]);
  });

  it("uses Close for workspace scope popover dismissal", () => {
    expect(BUYER_SCOPE_SWITCHER_CLOSE).toBe("Close");
  });
});
