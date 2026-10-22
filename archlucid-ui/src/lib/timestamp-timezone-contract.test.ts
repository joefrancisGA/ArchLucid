import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import { TIMESTAMP_TIMEZONE_BASELINE } from "@/lib/timestamp-timezone-baseline";

const SRC_ROOT = join(process.cwd(), "src");

const LOCALE_FORMATTER_CALL = /\.toLocale(?:Date|Time)?String\s*\(/g;

const REMEDIATION =
  "Timestamps must render the same text on server and client: use formatInstantForLocale / formatConversationListDate / formatInstantForBuyerGovernance from @/lib/locale-datetime, or pass an explicit timeZone option (TB-1678).";

/**
 * Returns the index just past the closing parenthesis of a call whose `(` sits at `openIndex`,
 * so multi-line option objects are read in full. String literals are skipped because a quoted
 * parenthesis would otherwise unbalance the scan.
 */
function findCallEnd(source: string, openIndex: number): number {
  let depth = 0;
  let quote = "";

  for (let index = openIndex; index < source.length; index += 1) {
    const character = source[index];

    if (quote.length > 0) {
      if (character === "\\") {
        index += 1;
        continue;
      }

      if (character === quote) {
        quote = "";
      }

      continue;
    }

    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }

    if (character === "(") {
      depth += 1;
      continue;
    }

    if (character === ")") {
      depth -= 1;

      if (depth === 0) {
        return index + 1;
      }
    }
  }

  return source.length;
}

function hasImplicitTimeZoneFormatting(source: string): boolean {
  const calls = new RegExp(LOCALE_FORMATTER_CALL.source, "g");
  let match = calls.exec(source);

  while (match !== null) {
    const openIndex = match.index + match[0].length - 1;
    const callEnd = findCallEnd(source, openIndex);

    if (!source.slice(openIndex, callEnd).includes("timeZone")) {
      return true;
    }

    calls.lastIndex = callEnd;
    match = calls.exec(source);
  }

  return false;
}

function listSourceFiles(directory: string): string[] {
  const collected: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);

    if (entry.isDirectory()) {
      collected.push(...listSourceFiles(absolute));
      continue;
    }

    if ([".ts", ".tsx"].includes(extname(absolute)) && !absolute.includes(".test.")) {
      collected.push(absolute);
    }
  }

  return collected;
}

function toPosixRelativePath(absolute: string): string {
  return relative(SRC_ROOT, absolute).split("\\").join("/");
}

function collectOffenders(): string[] {
  return listSourceFiles(SRC_ROOT)
    .filter((absolute) => hasImplicitTimeZoneFormatting(readFileSync(absolute, "utf8")))
    .map(toPosixRelativePath)
    .sort();
}

describe("timestamp time zone contract (TB-1678)", () => {
  it("flags a locale call that omits the time zone", () => {
    expect(hasImplicitTimeZoneFormatting("value.toLocaleDateString('en-US')")).toBe(true);
  });

  it("accepts a locale call pinned to a time zone across lines", () => {
    const source = `value.toLocaleString("en-US", {\n  timeZone: "UTC",\n  month: "short",\n})`;

    expect(hasImplicitTimeZoneFormatting(source)).toBe(false);
  });

  it("does not mistake a parenthesis inside a string literal for the call end", () => {
    const source = `value.toLocaleString("en-US (west)", { timeZone: "UTC" })`;

    expect(hasImplicitTimeZoneFormatting(source)).toBe(false);
  });

  /**
   * A `toLocale*` call without `timeZone` renders in the viewer's zone, so server and client
   * disagree during hydration and two operators reading the same evidence trail see different
   * times. This list may shrink but must never grow.
   */
  it("matches the grandfathered implicit-time-zone baseline exactly", () => {
    const offenders = collectOffenders();

    if (process.env.REFRESH_TIMESTAMP_TIMEZONE_BASELINE === "1") {
      const body = [
        "/** TB-1678 grandfathered `toLocale*` call sites without an explicit `timeZone`. Shrink when migrating to the shared formatters. */",
        "export const TIMESTAMP_TIMEZONE_BASELINE: readonly string[] = [",
        ...offenders.map((path) => `  "${path}",`),
        "] as const;",
        "",
      ].join("\n");
      writeFileSync(join(SRC_ROOT, "lib/timestamp-timezone-baseline.ts"), body, "utf8");
    }

    expect(offenders, REMEDIATION).toEqual([...TIMESTAMP_TIMEZONE_BASELINE].sort());
  });
});
