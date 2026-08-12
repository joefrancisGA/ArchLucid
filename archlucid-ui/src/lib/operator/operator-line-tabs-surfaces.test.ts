import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  OPERATOR_LINE_TABS_TB1662_SURFACES,
  operatorLineTabsModuleHasBannedListChrome,
  operatorLineTabsModuleHasBannedTriggerChrome,
  operatorLineTabsModuleUsesLineVariant,
} from "@/lib/operator/operator-line-tabs-surfaces";

const SRC_ROOT = join(process.cwd(), "src");

function readSrcModule(relativePath: string): string {
  return readFileSync(join(SRC_ROOT, relativePath), "utf8");
}

describe("operator-line-tabs-surfaces (TB-1662)", () => {
  it("tracks every TB-1662 named surface module", () => {
    expect(OPERATOR_LINE_TABS_TB1662_SURFACES.map((entry) => entry.id)).toEqual([
      "advisory-hub",
      "help-panel",
      "buyer-deliverables-artifacts",
      "runs-dashboard-operator",
    ]);
  });

  it.each(
    OPERATOR_LINE_TABS_TB1662_SURFACES.filter((entry) => entry.kind === "tabs-line").map((entry) => [
      entry.id,
      entry.modulePath,
    ]),
  )("%s uses variant=line and has no banned TabsList/TabsTrigger chrome", (_id, modulePath) => {
    const source = readSrcModule(modulePath);

    expect(operatorLineTabsModuleUsesLineVariant(source)).toBe(true);
    expect(operatorLineTabsModuleHasBannedListChrome(source)).toEqual([]);
    expect(operatorLineTabsModuleHasBannedTriggerChrome(source)).toEqual([]);
  });

  it("buyer deliverables surface does not render Tabs", () => {
    const source = readSrcModule("components/BuyerDeliverablesArtifactTabs.tsx");

    expect(source).not.toContain("<TabsList");
    expect(source).not.toContain("<TabsTrigger");
  });
});
