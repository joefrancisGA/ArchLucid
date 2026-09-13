import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DESIGN_TOKENS } from "@/lib/design-tokens";

const TABLE_TOKEN_KEYS = [
  "shell",
  "table",
  "headRow",
  "headCell",
  "body",
  "row",
  "rowSelected",
  "cell",
  "cellSecondary",
  "rowLabel",
] as const;

describe("design tokens table content-visibility ratchet (IE-DT-03)", () => {
  it("forbids content-visibility on EnterpriseTable token strings", () => {
    for (const key of TABLE_TOKEN_KEYS) {
      expect(DESIGN_TOKENS.table[key], `DESIGN_TOKENS.table.${key}`).not.toMatch(/content-visibility/);
    }
  });

  it("forbids content-visibility on enterprise-table row markup", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "components", "ui", "enterprise-table.tsx"),
      "utf8",
    );

    expect(source).not.toMatch(/content-visibility/);
  });

  it("removes the perf-wave-8 content-visibility-auto utility from globals.css", () => {
    const globalsCss = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");
    const chromeTokens = readFileSync(
      join(process.cwd(), "src", "lib", "design-tokens-shell-chrome.ts"),
      "utf8",
    );

    expect(globalsCss).not.toContain("content-visibility-auto");
    expect(chromeTokens).not.toContain("content-visibility-auto");
  });
});
