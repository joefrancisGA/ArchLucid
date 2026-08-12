import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ANCHOR_TAG_START,
  findOpeningTagEnd,
} from "@/lib/operator/operator-inline-link-affordance-patterns";

const SRC_ROOT = join(process.cwd(), "src");

/**
 * Navigational links painting their own colour with a raw Tailwind blue (TB-1676 ratchet baseline).
 *
 * `OPERATOR_LINK.nav` and `MARKETING_SURFACES.inlineLink` both resolve link colour through
 * `--al-accent-link`, so a theme change moves every link at once. A literal `text-blue-700`
 * does not track the accent token or dark mode consistently — sibling links drifted across
 * `blue-600`, `blue-700`, `blue-800`, and `blue-900` for the same affordance.
 * This list may shrink but must never grow.
 *
 * @see docs/library/UI_DESIGN_SYSTEM.md § Operator / marketing inline links
 */
const RAW_BLUE_LINK_BASELINE: ReadonlySet<string> = new Set([]);

const RAW_BLUE_TEXT_CLASS = /\btext-blue-\d{2,3}\b/;

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

function hasRawBlueLinkColour(absolute: string): boolean {
  const source = readFileSync(absolute, "utf8");
  const anchorStart = new RegExp(ANCHOR_TAG_START.source, "g");
  let match = anchorStart.exec(source);

  while (match !== null) {
    const tagEnd = findOpeningTagEnd(source, match.index);

    if (RAW_BLUE_TEXT_CLASS.test(source.slice(match.index, tagEnd))) {
      return true;
    }

    anchorStart.lastIndex = tagEnd;
    match = anchorStart.exec(source);
  }

  return false;
}

describe("link colour tokens (TB-1676)", () => {
  it("keeps raw blue link colours inside the frozen baseline", () => {
    const offenders = collectComponentFiles(SRC_ROOT)
      .filter(hasRawBlueLinkColour)
      .map(toPosixRelativePath)
      .filter((path) => !RAW_BLUE_LINK_BASELINE.has(path))
      .sort();

    expect(offenders).toEqual([]);
  });

  it("does not carry baseline entries that were already migrated", () => {
    const stale = [...RAW_BLUE_LINK_BASELINE]
      .filter((path) => !hasRawBlueLinkColour(join(SRC_ROOT, path)))
      .sort();

    expect(stale).toEqual([]);
  });
});
