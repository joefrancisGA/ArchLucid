import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

describe("inhabit pipeline stepper guard (IH-069)", () => {
  it("suppresses pipeline triage checklist on inhabited nested findings", () => {
    const scopeSection = readFileSync(
      join(
        SRC_ROOT,
        "app/(operator)/governance/findings/_sections/GovernanceFindingsQueueScopeSection.tsx",
      ),
      "utf8",
    );

    expect(scopeSection).toContain("suppressPipelineChrome");
    expect(scopeSection).toContain("IntegrationConnectChecklist");
    expect(scopeSection).toContain("!suppressPipelineChrome");
  });

  it("does not mount CorePilotChecklist on Working home first paint", () => {
    const headerSource = readFileSync(
      join(SRC_ROOT, "app/(operator)/_sections/OperatorHomePageHeader.tsx"),
      "utf8",
    );
    const shellAffordances = readFileSync(
      join(SRC_ROOT, "components/shell/AppShellMainAffordances.tsx"),
      "utf8",
    );

    expect(headerSource).not.toContain("CorePilotChecklist");
    expect(shellAffordances).toContain("isPersistentWorkspaceNextActionStripPath(pathname)");
    expect(shellAffordances).toContain("showPersistentWorkspaceNextActionStrip && teachingChromeVisible");
  });
});
