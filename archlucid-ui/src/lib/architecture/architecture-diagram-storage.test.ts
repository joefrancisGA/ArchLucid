import { describe, expect, it, beforeEach } from "vitest";

import {
  appendArchitectureDiagramVersion,
  readArchitectureDiagramCache,
  shouldRegenerateArchitectureDiagram,
} from "@/lib/architecture/architecture-diagram-storage";

describe("architecture diagram storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("caches generated versions and skips regeneration for the same fingerprint", () => {
    const result = appendArchitectureDiagramVersion({
      runId: "run-1",
      contentFingerprint: "fp-1",
      mermaidSource: "flowchart TB\n  a[\"A\"]",
      source: "generated",
      label: "Generated diagram",
    });

    const cache = result.record;

    expect(cache?.versions).toHaveLength(1);
    expect(shouldRegenerateArchitectureDiagram(cache, "fp-1", false)).toBe(false);
    expect(shouldRegenerateArchitectureDiagram(cache, "fp-2", false)).toBe(true);
    expect(result.writeFailed).toBe(false);
  });

  it("stores user-edited diagram versions", () => {
    appendArchitectureDiagramVersion({
      runId: "run-2",
      contentFingerprint: "fp-1",
      mermaidSource: "flowchart TB\n  a[\"A\"]",
      source: "generated",
      label: "Generated diagram",
    });
    const edited = appendArchitectureDiagramVersion({
      runId: "run-2",
      contentFingerprint: "fp-1",
      mermaidSource: "flowchart TB\n  a[\"A\"] --> b[\"B\"]",
      source: "user-edit",
      label: "Edited diagram",
    });

    const cache = edited.record;

    expect(cache?.versions).toHaveLength(2);
    expect(cache?.versions[1]?.source).toBe("user-edit");
  });
});
