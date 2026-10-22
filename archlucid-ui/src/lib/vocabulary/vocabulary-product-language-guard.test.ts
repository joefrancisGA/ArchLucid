/**
 * Folder-wide product-language guard for the vocabulary rails.
 *
 * Individual rail tests assert their own copy, so they cannot catch a banned term arriving in a
 * rail added later. This guard reads every `*-vocabulary.ts` file in the folder instead, which is
 * why a new rail is covered the moment it lands.
 *
 * Background: a sweep removed 132 occurrences of "job" from this folder, mostly the repeated tail
 * "— open the other when you need that job." Product language is defined in `archlucid-ui/AGENTS.md`
 * and `docs/library/UI_DESIGN_SYSTEM.md`.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const VOCABULARY_DIR = join(process.cwd(), "src", "lib", "vocabulary");

/**
 * Only unambiguous bans live here. "run" and "log" are deliberately absent: "runs" is legitimate as
 * a verb ("Architecture intelligence runs closed-loop reasoning"), and "log" is a substring of
 * "catalog", so either one would fail on correct copy instead of catching real drift.
 */
const BANNED_PRODUCT_LANGUAGE: readonly RegExp[] = [/\bjobs?\b/i, /\bsigned decision records?\b/i];

type CopyOffence = {
  readonly file: string;
  readonly line: number;
  readonly text: string;
};

function vocabularySourceFiles(): readonly string[] {
  return readdirSync(VOCABULARY_DIR)
    .filter((name) => name.endsWith("-vocabulary.ts"))
    .sort();
}

/**
 * Doc comments explain the copy rather than ship it to a buyer, so they are skipped. Tracking the
 * block-comment state line by line keeps the reported line numbers usable in a failure message.
 */
function shippedCopyLines(source: string): readonly { readonly line: number; readonly text: string }[] {
  const shipped: { line: number; text: string }[] = [];
  let inBlockComment = false;

  source.split(/\r?\n/).forEach((text, index) => {
    const trimmed = text.trim();

    if (inBlockComment) {
      if (trimmed.includes("*/")) inBlockComment = false;

      return;
    }

    if (trimmed.startsWith("/*")) {
      if (!trimmed.includes("*/")) inBlockComment = true;

      return;
    }

    if (trimmed.startsWith("//")) return;

    shipped.push({ line: index + 1, text });
  });

  return shipped;
}

function findOffences(): readonly CopyOffence[] {
  const offences: CopyOffence[] = [];

  for (const file of vocabularySourceFiles()) {
    const source = readFileSync(join(VOCABULARY_DIR, file), "utf8");

    for (const { line, text } of shippedCopyLines(source)) {
      for (const pattern of BANNED_PRODUCT_LANGUAGE) {
        if (pattern.test(text)) offences.push({ file, line, text: text.trim() });
      }
    }
  }

  return offences;
}

describe("vocabulary rails product language", () => {
  it("reads every rail file in the folder", () => {
    expect(vocabularySourceFiles().length).toBeGreaterThan(80);
  });

  it("ships no banned product language in rail copy", () => {
    const offences = findOffences();
    const report = offences.map((o) => `${o.file}:${o.line} ${o.text}`);

    expect(report).toEqual([]);
  });

  it("detects a banned term when one is reintroduced", () => {
    const planted = shippedCopyLines('export const X = "open the other when you need that job." as const;');

    expect(planted).toHaveLength(1);
    expect(BANNED_PRODUCT_LANGUAGE.some((pattern) => pattern.test(planted[0].text))).toBe(true);
  });

  it("ignores banned terms that appear only in doc comments", () => {
    const commented = shippedCopyLines("/**\n * Historically this rail said job.\n */\nexport const Y = 1;");

    expect(commented.map((entry) => entry.text.trim())).toEqual(["export const Y = 1;"]);
  });
});
