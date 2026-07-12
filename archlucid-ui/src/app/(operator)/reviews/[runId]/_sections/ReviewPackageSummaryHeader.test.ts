import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sectionsDir = dirname(fileURLToPath(import.meta.url));
const pageViewSource = readFileSync(join(sectionsDir, "RunDetailPageView.tsx"), "utf8");
const workspaceChromeSource = readFileSync(join(sectionsDir, "RunDetailWorkspaceChrome.tsx"), "utf8");

describe("Run detail workspace header integration", () => {
  it("uses workspace header and summary strip on RunDetailPageView", () => {
    expect(pageViewSource).toContain("<RunDetailWorkspaceHeader");
    expect(pageViewSource).toContain("<RunDetailWorkspaceSummaryStrip");
    expect(pageViewSource).not.toContain("<ReviewPackageSummaryHeader");
  });

  it("exposes customer-facing review metadata without internal ids in workspace header", () => {
    expect(workspaceChromeSource).toContain("data-testid=\"run-detail-workspace-header\"");
    expect(workspaceChromeSource).toContain("Review status");
    expect(workspaceChromeSource).not.toContain("runId");
  });

  it("uses shared operator layout spacing tokens", () => {
    expect(workspaceChromeSource).toContain("OPERATOR_LAYOUT.sectionStack");
    expect(pageViewSource).toContain("OPERATOR_LAYOUT.sectionStack");
  });
});
