/**
 * TB-2092 — forbid mid-page operator “Sources for follow-up” chrome.
 * Marketing strips and Cite Sources product UX are allowlisted.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

const FORBIDDEN_HEADING = "Sources for follow-up";

/** Relative posix path prefixes that may still render Sources for follow-up. */
const ALLOWLIST_PREFIXES = [
  "components/marketing/",
  "app/(marketing)/",
  "lib/tb2092-sources-followup-guard.test.ts",
] as const;

/** Cite Sources product surfaces (diligence UX — not mid-page hub chrome). */
const ALLOWLIST_NAME_SUBSTRINGS = ["CiteStrip", "cite-strip", "CiteSources"] as const;

const SCAN_SUFFIXES = [".ts", ".tsx"] as const;

function isAllowlisted(relativePosix: string, fileName: string): boolean {
  if (ALLOWLIST_PREFIXES.some((prefix) => relativePosix.startsWith(prefix))) {
    return true;
  }

  return ALLOWLIST_NAME_SUBSTRINGS.some((token) => fileName.includes(token) || relativePosix.includes(token));
}

function shouldScanFile(fileName: string): boolean {
  if (fileName.endsWith(".test.ts") || fileName.endsWith(".test.tsx")) {
    // Tests may assert absence; only scan production sources for the heading.
    return false;
  }

  return SCAN_SUFFIXES.some((suffix) => fileName.endsWith(suffix));
}

function collectFiles(dir: string): string[] {
  const out: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") {
        continue;
      }

      out.push(...collectFiles(full));
      continue;
    }

    if (entry.isFile() && shouldScanFile(entry.name)) {
      out.push(full);
    }
  }

  return out;
}

describe("TB-2092 Sources for follow-up guard", () => {
  it("forbids the mid-page Sources heading outside marketing and Cite strips", () => {
    const violations: string[] = [];

    for (const absolutePath of collectFiles(SRC_ROOT)) {
      const relativePosix = relative(SRC_ROOT, absolutePath).replace(/\\/g, "/");
      const fileName = absolutePath.replace(/\\/g, "/").split("/").pop() ?? "";

      if (isAllowlisted(relativePosix, fileName)) {
        continue;
      }

      const source = readFileSync(absolutePath, "utf8");

      if (source.includes(FORBIDDEN_HEADING)) {
        violations.push(relativePosix);
      }
    }

    expect(violations).toEqual([]);
  });

  it("has no operator EvidenceOrientationStrip / SourcesStrip modules on disk", () => {
    const leftovers: string[] = [];
    const operatorRoot = join(SRC_ROOT, "app", "(operator)");

    function walk(dir: string): void {
      let entries;
      try {
        entries = readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        const full = join(dir, entry.name);

        if (entry.isDirectory()) {
          walk(full);
          continue;
        }

        if (!entry.isFile()) {
          continue;
        }

        const name = entry.name;
        if (name.includes("CiteStrip")) {
          continue;
        }

        if (name.includes("EvidenceOrientationStrip") || name.includes("SourcesStrip")) {
          leftovers.push(relative(SRC_ROOT, full).replace(/\\/g, "/"));
        }
      }
    }

    if (existsSync(operatorRoot)) {
      walk(operatorRoot);
    }

    expect(leftovers).toEqual([]);
  });
});
