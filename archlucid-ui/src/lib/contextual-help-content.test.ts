import { afterEach, describe, expect, it, vi } from "vitest";

import { contextualHelpByKey, toDocsBlobUrl } from "./contextual-help-content";
import { collectContextualHelpKeysFromSource, defaultArchlucidUiSrcRoot } from "./contextual-help-keys-from-source";

describe("contextualHelpByKey", () => {
  it("defines every helpKey used by <ContextualHelp /> in production source (no missing index entries)", () => {
    const fromSource = collectContextualHelpKeysFromSource(defaultArchlucidUiSrcRoot());

    for (const key of fromSource) {
      expect(contextualHelpByKey[key], key).toBeDefined();
    }
  });

  it("index keys match production helpKey props exactly (no unused index entries, no typo orphans)", () => {
    const fromSource = collectContextualHelpKeysFromSource(defaultArchlucidUiSrcRoot());
    const indexKeys = Object.keys(contextualHelpByKey).sort((a, b) => a.localeCompare(b));

    expect(fromSource).toEqual(indexKeys);
  });

  it("defines all contextual help keys with non-empty text under 200 chars", () => {
    for (const key of Object.keys(contextualHelpByKey)) {
      const entry = contextualHelpByKey[key];
      expect(entry, key).toBeDefined();
      expect(entry.text.length, key).toBeGreaterThan(0);
      expect(entry.text.length, key).toBeLessThan(200);
    }
  });

  it("uses /-prefixed learn more paths when present", () => {
    for (const key of Object.keys(contextualHelpByKey)) {
      const u = contextualHelpByKey[key].learnMoreUrl;

      if (u == null) {
        continue;
      }

      expect(u.startsWith("/"), key).toBe(true);
    }
  });

  it("toDocsBlobUrl builds a GitHub blob URL for default branch", () => {
    const url = toDocsBlobUrl("/docs/CORE_PILOT.md#x");

    expect(url).toMatch(/^https:\/\/github\.com\//);
    expect(url).toContain("docs/CORE_PILOT.md#x");
  });
});

describe("toDocsBlobUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses NEXT_PUBLIC_ARCHLUCID_DOCS_BLOB_BASE when set", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_DOCS_BLOB_BASE", "https://ghe.example.com/org/repo/blob/develop");

    expect(toDocsBlobUrl("/docs/CORE_PILOT.md#h")).toBe(
      "https://ghe.example.com/org/repo/blob/develop/docs/CORE_PILOT.md#h",
    );
  });

  it("strips trailing slash from custom blob base", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_DOCS_BLOB_BASE", "https://ghe.example.com/org/repo/blob/develop/");

    expect(toDocsBlobUrl("/docs/X.md")).toBe("https://ghe.example.com/org/repo/blob/develop/docs/X.md");
  });
});
