import { existsSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_GITHUB_BLOB_BASE } from "@/lib/docs-public-base";

import {
  CONTEXTUAL_HELP_PAGE_KEYS,
  getHelpUrl,
  listContextualHelpDocPaths,
} from "./contextual-help";

/** Monorepo root when Vitest's cwd is `archlucid-ui/` (CI and `npm test`). */
const repoRoot = join(process.cwd(), "..");

describe("contextual-help", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("maps every known page key to a URL", () => {
    for (const key of CONTEXTUAL_HELP_PAGE_KEYS) {
      const url = getHelpUrl(key);

      expect(url, key).toMatch(/^https?:\/\//);
    }
  });

  it("uses NEXT_PUBLIC_DOCS_BASE_URL when set", () => {
    vi.stubEnv("NEXT_PUBLIC_DOCS_BASE_URL", "https://docs.example.com/root/");

    expect(getHelpUrl("/compare")).toBe("https://docs.example.com/root/docs/library/COMPARISON_REPLAY.md");
  });

  it("includes fragments for runs list and run detail keys", () => {
    vi.stubEnv("NEXT_PUBLIC_DOCS_BASE_URL", undefined);

    const blobBase = DEFAULT_GITHUB_BLOB_BASE.replace(/\/$/, "");
    expect(getHelpUrl("/runs")).toBe(`${blobBase}/docs/library/OPERATOR_QUICKSTART.md#operator-ui`);
    expect(getHelpUrl("/runs/[id]")).toContain("#main-workflow");
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
