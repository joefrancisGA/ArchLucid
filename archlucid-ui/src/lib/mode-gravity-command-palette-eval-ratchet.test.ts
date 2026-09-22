import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  MODE_GRAVITY_COMMAND_PALETTE_FILTER_MODULE,
  MODE_GRAVITY_COMMAND_PALETTE_WIRED_HELPERS,
} from "@/lib/mode-gravity-command-palette-eval-ratchet";

const UI_ROOT = join(process.cwd());

describe("mode-gravity command palette eval ratchet (MG-015)", () => {
  it("filters Working palette hrefs and stays wired to sidebar visibility", () => {
    const filterSource = readFileSync(
      join(UI_ROOT, `src/lib/${MODE_GRAVITY_COMMAND_PALETTE_FILTER_MODULE}.ts`),
      "utf8",
    );
    const paletteSource = readFileSync(join(UI_ROOT, "src/components/CommandPalette.tsx"), "utf8");
    const parityTest = readFileSync(
      join(UI_ROOT, "src/lib/command-palette-working-nav-parity.test.ts"),
      "utf8",
    );

    expect(filterSource).toContain("isWorkingPaletteNavHrefAllowed");
    for (const helper of MODE_GRAVITY_COMMAND_PALETTE_WIRED_HELPERS) {
      expect(paletteSource).toContain(helper);
    }
    expect(parityTest).toContain("filterWorkingPaletteNavHrefs");
  });
});
