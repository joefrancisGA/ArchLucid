import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import nextConfig from "../../../next.config";

const OPERATOR_APP_ROOT = join(process.cwd(), "src", "app", "(operator)");

function operatorPageFiles(): string[] {
  const pages: string[] = [];

  function walk(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const fullPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);

        continue;
      }

      if (entry.name === "page.tsx") {
        pages.push(fullPath);
      }
    }
  }

  walk(OPERATOR_APP_ROOT);

  return pages;
}

describe("next.config — no permanent bookmark redirects (IA batch 4)", () => {
  it("does not ship next.config permanent redirects", async () => {
    const redirectRules = await nextConfig.redirects?.();
    const permanent = (redirectRules ?? []).filter((rule) => rule.permanent === true);

    expect(permanent).toEqual([]);
  });

  it("does not ship App Router permanentRedirect bookmark shims under (operator)", () => {
    const offenders = operatorPageFiles().filter((pagePath) =>
      readFileSync(pagePath, "utf8").includes("permanentRedirect("),
    );

    expect(offenders).toEqual([]);
  });
});
