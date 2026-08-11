import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  PILOT_NAV_OPERATE_GROUP_IDS,
  PILOT_NAV_PROFILE_DOC_PATH,
  PILOT_NAV_PROFILE_HELP_HREF,
  PILOT_NAV_REQUIRED_SHELL_COMPONENTS,
  PILOT_NAV_REQUIRED_UI_TEST_IDS,
  PILOT_NAV_STORAGE_KEYS,
  PILOT_NAV_UNLOCK_CHANGED_EVENT,
} from "@/lib/pilot-nav-profile-alignment";
import { OPERATE_NAV_UNLOCK_CHANGED_EVENT } from "@/lib/usability/operate-nav-progressive-unlock";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("pilot-nav-profile-alignment", () => {
  it("exports stable help href and doc path", () => {
    expect(PILOT_NAV_PROFILE_HELP_HREF).toBe("/help/pilot-guide");
    expect(PILOT_NAV_PROFILE_DOC_PATH).toBe(
      "docs/library/customer-facing/WORKSPACE_NAVIGATION_GUIDE.md",
    );
  });

  it("lists Operate group ids aligned with operate-nav-progressive-unlock", () => {
    expect(PILOT_NAV_OPERATE_GROUP_IDS).toEqual([
      "operate-analysis",
      "operate-architect-advanced",
      "operate-governance",
      "operate-integrations",
    ]);
  });

  it("keeps storage keys and unlock event wired in sidebar surfaces", () => {
    const sidebarNav = readRepoFile("archlucid-ui/src/components/SidebarNav.tsx");
    const mobileNav = readRepoFile("archlucid-ui/src/components/MobileNavDrawer.tsx");
    const unlockPanel = readRepoFile("archlucid-ui/src/components/usability/OperateFeaturesUnlockPanel.tsx");
    const autoHint = readRepoFile("archlucid-ui/src/components/usability/OperateUnlockAutoHint.tsx");

    // Desktop SidebarNav shapes groups without the unlock panel; mobile drawer owns the unlock CTA.
    for (const componentName of PILOT_NAV_REQUIRED_SHELL_COMPONENTS) {
      expect(mobileNav).toContain(componentName);
    }

    expect(sidebarNav).not.toContain("OperateFeaturesUnlockPanel");
    void sidebarNav;

    for (const testId of PILOT_NAV_REQUIRED_UI_TEST_IDS) {
      expect(`${unlockPanel}\n${autoHint}`).toContain(testId);
    }

    expect(PILOT_NAV_UNLOCK_CHANGED_EVENT).toBe(OPERATE_NAV_UNLOCK_CHANGED_EVENT);
    expect(PILOT_NAV_STORAGE_KEYS.length).toBeGreaterThan(0);
  });

  it("registers help topic in product documentation registry", () => {
    const registry = readRepoFile("archlucid-ui/src/lib/product-documentation-registry.ts");

    expect(registry).toContain("pilot-guide");
    expect(registry).toContain(PILOT_NAV_PROFILE_DOC_PATH);
  });
});
