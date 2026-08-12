import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_WORKSPACE_DEFAULT_TAB,
  buildArchitectureWorkspaceTabHref,
  readArchitectureWorkspaceTabFromHref,
  resolveArchitectureWorkspaceTab,
  resolveArchitectureWorkspaceTabFromHash,
} from "@/lib/architecture/architecture-workspace-tabs";

describe("architecture-workspace-tabs", () => {
  it("resolves unknown tab params to overview", () => {
    expect(resolveArchitectureWorkspaceTab(null)).toBe(ARCHITECTURE_WORKSPACE_DEFAULT_TAB);
    expect(resolveArchitectureWorkspaceTab("not-a-tab")).toBe(ARCHITECTURE_WORKSPACE_DEFAULT_TAB);
    expect(resolveArchitectureWorkspaceTab("findings")).toBe("findings");
  });

  it("maps legacy hash anchors to workspace tabs", () => {
    expect(resolveArchitectureWorkspaceTabFromHash("architecture-diagram")).toBe("diagram");
    expect(resolveArchitectureWorkspaceTabFromHash("#run-explanation")).toBe("findings");
    expect(resolveArchitectureWorkspaceTabFromHash("capture-evidence")).toBe("evidence");
    expect(resolveArchitectureWorkspaceTabFromHash("architecture-assessment-progress")).toBe("activity");
    expect(resolveArchitectureWorkspaceTabFromHash("submitted-architecture")).toBe("overview");
    expect(resolveArchitectureWorkspaceTabFromHash("unknown-anchor")).toBeNull();
  });

  it("builds shareable tab hrefs without forcing create-architecture query context (TB-1833)", () => {
    const href = buildArchitectureWorkspaceTabHref("run-abc", "governance");

    expect(href).toBe("/architecture/reviews/run-abc?archTab=governance");
    expect(href).not.toContain("fromGeneration=1");
    expect(href).not.toContain("intent=create-architecture");
  });

  it("can opt in to create-architecture query context when a caller requires create-home chrome", () => {
    const href = buildArchitectureWorkspaceTabHref("run-abc", "governance", {
      includeCreateIntent: true,
    });

    expect(href).toContain("archTab=governance");
    expect(href).toContain("fromGeneration=1");
    expect(href).toContain("intent=create-architecture");
  });

  it("reads tab ids from href hash or search param", () => {
    expect(readArchitectureWorkspaceTabFromHref("#architecture-diagram")).toBe("diagram");
    expect(readArchitectureWorkspaceTabFromHref("/architecture/reviews/run-1?archTab=evidence")).toBe("evidence");
    expect(readArchitectureWorkspaceTabFromHref("/architecture/reviews/new")).toBeNull();
  });
});
