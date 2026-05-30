import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CONTEXTUAL_HELP_PAGE_KEYS,
  getHelpUrl,
  listContextualHelpDocPaths,
} from "./contextual-help";

/** Monorepo root when Vitest's cwd is `archlucid-ui/` (CI and `npm test`). */
const repoRoot = join(process.cwd(), "..");

describe("contextual-help", () => {
  it("maps every known page key to an in-app help route", () => {
    for (const key of CONTEXTUAL_HELP_PAGE_KEYS) {
      const url = getHelpUrl(key);

      expect(url, key).toMatch(/^\/help(?:\/|$)/);
    }
  });

  it("maps compare to the comparison replay help topic", () => {
    expect(getHelpUrl("/compare")).toBe("/help/comparison-replay");
  });

  it("includes fragments for runs list and run detail keys", () => {
    expect(getHelpUrl("/runs")).toBe("/help/getting-started#operator-ui");
    expect(getHelpUrl("/runs/[id]")).toBe("/help/operator-shell#main-workflow");
  });

  it("resolves every mapped doc path to a file under the repo root", () => {
    for (const relative of listContextualHelpDocPaths()) {
      const absolute = join(repoRoot, relative);

      expect(existsSync(absolute), `Missing doc: ${relative}`).toBe(true);
    }
  });

  it("returns null for unknown page keys", () => {
    expect(getHelpUrl("/unknown-route")).toBeNull();
  });
});
