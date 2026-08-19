import { describe, expect, it } from "vitest";

import { readRegisteredSource, readSiblingSource } from "@/testing/source-scan-harness";

const pageViewSource = readRegisteredSource("run-detail-page-view");
// Standard-mode tab panels (including the summary strip) live in RunDetailTabbedWorkspace,
// which RunDetailPageView mounts as `tabbedWorkspaceEl`.
const tabbedWorkspaceSource = readRegisteredSource("run-detail-tabbed-workspace");

describe("Run detail workspace header integration", () => {
  it("uses workspace header and review status summary on RunDetailPageView", () => {
    expect(pageViewSource).toContain("<RunDetailWorkspaceHeaderDeferred");
    expect(tabbedWorkspaceSource).toContain("<RunDetailWorkspaceSummaryStripDeferred");
    expect(pageViewSource).not.toContain("<ReviewPackageSummaryHeader");
    expect(tabbedWorkspaceSource).not.toContain("<ReviewPackageSummaryHeader");
  });

  it("uses shared operator layout spacing tokens", () => {
    const shellSource = readSiblingSource(import.meta.url, "RunDetailWorkspaceShell.tsx");

    expect(shellSource).toContain("OPERATOR_LAYOUT.sectionStack");
    expect(pageViewSource).toContain("OPERATOR_LAYOUT.sectionStack");
    expect(pageViewSource).toContain("OPERATOR_PAGE_CONTAINER.variant.dashboard");
  });
});
