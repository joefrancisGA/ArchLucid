import { afterEach, describe, expect, it, vi } from "vitest";

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

  it("toDocsBlobUrl resolves in-app help routes", () => {
    const url = toDocsBlobUrl("/docs/CORE_PILOT.md#x");

    expect(url).toBe("/help/core-pilot#x");
  });
});

describe("contextualHelpTriggerSummary", () => {
  it("returns the first sentence when help copy contains a period", () => {
    expect(contextualHelpTriggerSummary(contextualHelpByKey["new-run-wizard"].text, "new-run-wizard")).toBe(
      "Create an architecture request for what ArchLucid should analyze.",
    );
  });

  it("falls back to helpKey words when text is empty", () => {
    expect(contextualHelpTriggerSummary("   ", "new-run-wizard")).toBe("new run wizard");
  });
});

describe("contextualHelpTriggerAriaLabel", () => {
  it("prefixes the summary with Contextual help for known keys", () => {
    expect(contextualHelpTriggerAriaLabel("new-run-wizard")).toBe(
      "Contextual help: Create an architecture request for what ArchLucid should analyze.",
    );
  });

  it("returns null for unknown keys", () => {
    expect(contextualHelpTriggerAriaLabel("not-a-real-key")).toBeNull();
  });

  it("builds ask-archlucid label from first sentence (axe/regression)", () => {
    expect(contextualHelpTriggerAriaLabel("ask-archlucid")).toBe(
      "Contextual help: Multi-turn conversations about an architecture review.",
    );
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
