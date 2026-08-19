import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  DEVELOPER_SETTINGS_CUSTOMER_SHELL_REDIRECT_PATH,
  DEVELOPER_SETTINGS_TRAFFIC_MONTHLY_SHARE,
  DEVELOPER_SETTINGS_TRAFFIC_PATH,
} from "@/lib/ui-route-traffic-developer-settings";
import {
  INTERNAL_DEVELOPER_TOOLS_CATALOG_GATE_NOTE,
  INTERNAL_DEVELOPER_TOOLS_SHIPPED_INVENTORY,
} from "@/app/(operator)/administration/developer/developer-settings-copy";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const DEVELOPER_SETTINGS_BAND_TEST_FILES = [
  "src/lib/ui-route-traffic-developer-settings.test.ts",
  "src/app/(operator)/administration/_sections/settings-master-catalog.test.ts",
  "src/components/TryCliDemoCard.test.tsx",
  "src/app/(operator)/administration/_sections/settings-master-page-model.test.ts",
  "src/app/(operator)/administration/developer/page.test.tsx",
  "src/app/(operator)/administration/developer/DeveloperSettingsPageClient.test.tsx",
] as const;

describe("developer-settings band regression (TB-1900)", () => {
  it("keeps sibling Vitest guards for TB-1896 through TB-1899 on disk", () => {
    for (const relativePath of DEVELOPER_SETTINGS_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("documents internal-gated traffic honesty and customer-shell redirect (TB-1896)", () => {
    expect(DEVELOPER_SETTINGS_TRAFFIC_PATH).toBe("/administration/developer");
    expect(DEVELOPER_SETTINGS_TRAFFIC_MONTHLY_SHARE).toBe("0");
    expect(DEVELOPER_SETTINGS_CUSTOMER_SHELL_REDIRECT_PATH).toBe("/account/preferences");
  });

  it("keeps catalog inventory aligned to theme + local CLI demo only (TB-1897)", () => {
    expect(INTERNAL_DEVELOPER_TOOLS_SHIPPED_INVENTORY.join("\n").toLowerCase()).toContain("theme");
    expect(INTERNAL_DEVELOPER_TOOLS_SHIPPED_INVENTORY.join("\n").toLowerCase()).toContain("cli");
    expect(INTERNAL_DEVELOPER_TOOLS_SHIPPED_INVENTORY.join("\n").toLowerCase()).not.toContain("diagnostics");
  });

  it("keeps internal-shell gate note on catalog metadata (TB-1899)", () => {
    expect(INTERNAL_DEVELOPER_TOOLS_CATALOG_GATE_NOTE.toLowerCase()).toContain("internal");
  });

  it("keeps CLI demo disclosure and server gate Vitest on disk (TB-1898 / TB-1896)", () => {
    expect(existsSync(join(UI_ROOT, "src/components/TryCliDemoCard.test.tsx"))).toBe(true);
    expect(existsSync(join(UI_ROOT, "src/app/(operator)/administration/developer/page.test.tsx"))).toBe(true);
  });
});
