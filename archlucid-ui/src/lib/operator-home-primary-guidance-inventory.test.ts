import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { OPERATOR_HOME_RETIRED_PRIMARY_GUIDANCE_IMPORTS } from "@/lib/operator-canonical-next-action";

const libDir = dirname(fileURLToPath(import.meta.url));
const srcRoot = join(libDir, "..");

const homePageViewSource = readFileSync(
  join(srcRoot, "app/(operator)/_sections/OperatorHomePageView.tsx"),
  "utf8",
);
const stickinessSource = readFileSync(
  join(srcRoot, "components/operator-home/OperatorHomeStickinessCockpit.tsx"),
  "utf8",
);
const commandCenterSource = readFileSync(
  join(srcRoot, "components/usability/PilotCommandCenterCard.tsx"),
  "utf8",
);

describe("operator home primary guidance inventory (TB-2232 / TB-2331)", () => {
  it("routes home next-action through the canonical slot in the command center", () => {
    expect(commandCenterSource).toContain("OperatorHomeCanonicalNextActionSlot");
    expect(commandCenterSource).toContain("useOperatorHomeEmptyDoThisNextAction");
    expect(commandCenterSource).not.toContain("OperatorHomeDoThisNextCard");
  });

  it("does not mount a peer walkthrough panel above the canonical next-action slot (TB-2331)", () => {
    expect(commandCenterSource).not.toContain("GoldenSponsorPackageWalkthroughPanel");
  });

  it("does not mount retired parallel guidance widgets on the home page shell", () => {
    for (const retiredImport of OPERATOR_HOME_RETIRED_PRIMARY_GUIDANCE_IMPORTS) {
      expect(homePageViewSource).not.toContain(retiredImport);
      expect(stickinessSource).not.toContain(retiredImport);
    }
  });

  it("keeps stickiness cockpit focused on repeat-usage snapshot only", () => {
    expect(stickinessSource).toContain("OperatorStickinessSnapshotCard");
    expect(stickinessSource).not.toContain("OperatorNextActionsCard");
  });

  it("hides stickiness cockpit on first-session eval-empty home (TB-2331)", () => {
    expect(stickinessSource).toContain('workspacePhase === "eval-empty"');
    expect(stickinessSource).toContain("return null");
  });
});
