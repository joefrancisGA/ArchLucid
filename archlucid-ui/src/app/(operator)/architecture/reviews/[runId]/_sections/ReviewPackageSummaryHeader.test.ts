import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sectionsDir = dirname(fileURLToPath(import.meta.url));
const pageViewSource = readFileSync(join(sectionsDir, "RunDetailPageView.tsx"), "utf8");

describe("Run detail workspace header integration", () => {
  it("uses workspace header and review status summary on RunDetailPageView", () => {
    expect(pageViewSource).toContain("<RunDetailWorkspaceHeaderDeferred");
    expect(pageViewSource).toContain("<RunDetailWorkspaceSummaryStripDeferred");
    expect(pageViewSource).not.toContain("<ReviewPackageSummaryHeader");
  });

  it("uses shared operator layout spacing tokens", () => {
    const shellSource = readFileSync(join(sectionsDir, "RunDetailWorkspaceShell.tsx"), "utf8");

    expect(shellSource).toContain("OPERATOR_LAYOUT.sectionStack");
    expect(pageViewSource).toContain("OPERATOR_LAYOUT.sectionStack");
    expect(pageViewSource).toContain("OPERATOR_PAGE_CONTAINER.variant.dashboard");
  });
});
