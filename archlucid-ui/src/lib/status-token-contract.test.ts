import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const GLOBALS_CSS = join(process.cwd(), "src", "app", "globals.css");

/**
 * Matches an innermost CSS declaration block, e.g. `:root { … }`. Blocks nested in at-rules
 * are matched at their inner level, which is where custom properties are declared.
 */
const DECLARATION_BLOCK = /([^{}]+)\{([^{}]*)\}/g;

const STATUS_DECLARATION = /(--al-status-[a-z0-9-]+)\s*:\s*([^;]+);/g;

const VAR_REFERENCE = /^var\(\s*(--[a-z0-9-]+)\s*\)$/;

type StatusDeclaration = {
  readonly selector: string;
  readonly name: string;
  readonly value: string;
};

function readStatusDeclarations(): readonly StatusDeclaration[] {
  const css = readFileSync(GLOBALS_CSS, "utf8");
  const declarations: StatusDeclaration[] = [];
  let block = DECLARATION_BLOCK.exec(css);

  while (block !== null) {
    const selector = block[1].trim().split("\n").at(-1)?.trim() ?? "";
    let declaration = STATUS_DECLARATION.exec(block[2]);

    while (declaration !== null) {
      declarations.push({ selector, name: declaration[1], value: declaration[2].trim() });
      declaration = STATUS_DECLARATION.exec(block[2]);
    }

    block = DECLARATION_BLOCK.exec(css);
  }

  return declarations;
}

function findDuplicateLiteralGroups(): readonly string[] {
  const bySelectorAndValue = new Map<string, string[]>();

  for (const declaration of readStatusDeclarations()) {
    if (VAR_REFERENCE.test(declaration.value)) {
      continue;
    }

    const key = `${declaration.selector} ${declaration.value}`;
    bySelectorAndValue.set(key, [...(bySelectorAndValue.get(key) ?? []), declaration.name]);
  }

  return [...bySelectorAndValue.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([key, names]) => `${key} → ${[...names].sort().join(", ")}`)
    .sort();
}

describe("status color tokens (TB-1677)", () => {
  /**
   * Two status tokens holding the same literal color render identically while drifting
   * independently — a later tweak to one silently splits states that were meant to match.
   * Deliberate sharing must be written as `var(--other-token)` so the intent is explicit.
   */
  it("declares each status color once and expresses sharing as an alias", () => {
    expect(findDuplicateLiteralGroups()).toEqual([]);
  });

  it("points every status alias at a declared token", () => {
    const declarations = readStatusDeclarations();
    const declaredNames = new Set(declarations.map((declaration) => declaration.name));

    const danglingAliases = declarations
      .map((declaration) => ({ declaration, alias: VAR_REFERENCE.exec(declaration.value) }))
      .filter((entry) => entry.alias !== null && !declaredNames.has(entry.alias[1]))
      .map((entry) => `${entry.declaration.name} → ${entry.declaration.value}`)
      .sort();

    expect(danglingAliases).toEqual([]);
  });

  it("scans the token declarations it claims to guard", () => {
    expect(readStatusDeclarations().length).toBeGreaterThan(10);
  });
});
