import { describe, expect, it } from "vitest";

import {
  contextualHelpByKey,
  contextualHelpTriggerAriaLabel,
  contextualHelpTriggerSummary,
  toDocsBlobUrl,
} from "./contextual-help-content";
import { collectContextualHelpKeysFromSource, defaultArchlucidUiSrcRoot } from "./contextual-help-keys-from-source";

describe("contextualHelpByKey", () => {
  it("defines every helpKey used by <ContextualHelp /> in production source (no missing index entries)", () => {
    const fromSource = collectContextualHelpKeysFromSource(defaultArchlucidUiSrcRoot());

    for (const key of fromSource) {
      expect(contextualHelpByKey[key], key).toBeDefined();
    }
  });

  it("index keys match active ContextualHelp usage exactly (no unused index entries, no typo orphans)", () => {
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

  it("does not leak engineering-only doc paths in visible help copy", () => {
    const forbiddenInText = ["docs/library/", ".csproj", "github.com/"];

    for (const key of Object.keys(contextualHelpByKey)) {
      const entry = contextualHelpByKey[key];

      for (const pattern of forbiddenInText) {
        expect(entry.text.toLowerCase(), key).not.toContain(pattern);
      }
    }
  });

  it("does not link to contributor-reference engineering docs", () => {
    for (const key of Object.keys(contextualHelpByKey)) {
      const u = contextualHelpByKey[key].learnMoreUrl;

      if (u == null) {
        continue;
      }

      expect(u.toLowerCase(), key).not.toContain("contributor-reference");
    }
  });

  it("toDocsBlobUrl resolves in-app help routes", () => {
    const url = toDocsBlobUrl("/docs/CORE_PILOT.md#x");

    expect(url).toBe("/help/core-pilot#x");
  });
});

describe("contextualHelpTriggerSummary", () => {
  it("returns the first sentence when help copy contains a period", () => {
    expect(contextualHelpTriggerSummary(contextualHelpByKey["commit-manifest"].text, "commit-manifest")).toBe(
      "Finalizing produces a versioned, reviewed manifest and synthesizes artifacts.",
    );
  });

  it("falls back to helpKey words when text is empty", () => {
    expect(contextualHelpTriggerSummary("   ", "commit-manifest")).toBe("finalize review");
  });
});

describe("contextualHelpTriggerAriaLabel", () => {
  it("prefixes the summary with Contextual help for known keys", () => {
    expect(contextualHelpTriggerAriaLabel("commit-manifest")).toBe(
      "Contextual help: Finalizing produces a versioned, reviewed manifest and synthesizes artifacts.",
    );
  });

  it("returns null for unknown keys", () => {
    expect(contextualHelpTriggerAriaLabel("not-a-real-key")).toBeNull();
  });

  it("builds governance-gate label from help copy (ContextualHelp keyboard test)", () => {
    expect(contextualHelpTriggerAriaLabel("governance-gate")).toBe(
      "Contextual help: When enabled, governance approval rules check findings against severity thresholds before allowing finalization.",
    );
  });
});

describe("toDocsBlobUrl", () => {
  it("maps core pilot path to in-app help", () => {
    expect(toDocsBlobUrl("/docs/CORE_PILOT.md#h")).toBe("/help/core-pilot#h");
  });

  it("falls back to help index for unknown paths", () => {
    expect(toDocsBlobUrl("/docs/unknown/NO_SUCH_DOC.md")).toBe("/help");
  });
});
