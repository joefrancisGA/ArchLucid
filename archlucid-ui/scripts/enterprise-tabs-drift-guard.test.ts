import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

function readRepoFile(relativePath: string): string {
  return readFileSync(join(REPO_ROOT, relativePath), "utf8");
}

describe("enterprise Tabs primitive drift guard (TB-665)", () => {
  it("ships accessible Tabs primitives under components/ui", () => {
    const tabs = readRepoFile("archlucid-ui/src/components/ui/tabs.tsx");
    const keyboard = readRepoFile("archlucid-ui/src/components/ui/tabs-keyboard.ts");

    expect(tabs).toContain('role="tablist"');
    expect(tabs).toContain('role="tabpanel"');
    expect(tabs).toContain("aria-selected");
    expect(tabs).toContain("aria-controls");
    expect(tabs).toContain("syncUrlParam");
    expect(keyboard).toContain("resolveNextTabIndex");
  });

  it("documents tabs vs chips decision table in UI_DESIGN_SYSTEM.md", () => {
    const doc = readRepoFile("docs/library/UI_DESIGN_SYSTEM.md");

    expect(doc).toContain("TB-665");
    expect(doc).toContain("Tabs vs");
  });

  it("includes Vitest coverage for keyboard and URL sync", () => {
    const tests = readRepoFile("archlucid-ui/src/components/ui/tabs.test.tsx");
    const advisoryHub = readRepoFile("archlucid-ui/src/components/advisory/AdvisoryHubClient.test.tsx");

    expect(tests).toContain("ArrowRight");
    expect(tests).toContain("syncUrlParam");
    expect(tests).toContain("aria-selected");
    expect(advisoryHub).toContain("AdvisoryHubClient (TB-670)");
    expect(advisoryHub).toContain("ArrowLeft");
  });

  it("migrates TB-670 call sites onto shared Tabs imports", () => {
    const advisoryHub = readRepoFile("archlucid-ui/src/components/advisory/AdvisoryHubClient.tsx");
    const settingsRoles = readRepoFile(
      "archlucid-ui/src/app/(operator)/administration/users/_sections/SettingsRolesPageView.tsx",
    );
    const alertRulesHub = readRepoFile(
      "archlucid-ui/src/app/(operator)/governance/alert-rules/AlertRulesHubClient.tsx",
    );

    expect(advisoryHub).toContain('@/components/ui/tabs');
    expect(advisoryHub).toContain("TabsContent");
    expect(settingsRoles).toContain("settingsUsersTabFromLocation");
    expect(settingsRoles).toContain("onValueChange={onSelectTab}");
    expect(alertRulesHub).toContain('variant="line"');
    expect(alertRulesHub).not.toMatch(/role\s*=\s*["']tablist["']/);
  });
});
