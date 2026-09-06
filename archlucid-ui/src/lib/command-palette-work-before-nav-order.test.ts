import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const UI_ROOT = join(process.cwd());

describe("CommandPalette work-before-nav order (PC-11)", () => {
  it("renders work actions before architecture identity and page search groups", () => {
    const source = readFileSync(join(UI_ROOT, "src/components/CommandPalette.tsx"), "utf8");
    const listStart = source.indexOf("<CommandList>");
    const listEnd = source.indexOf("</CommandList>", listStart);
    const listBody = source.slice(listStart, listEnd);

    expect(listBody.indexOf("CommandPaletteActions")).toBeLessThan(
      listBody.indexOf("CommandPaletteArchitectureIdentitiesGroup"),
    );
    expect(listBody.indexOf("CommandPaletteReviewActions")).toBeLessThan(
      listBody.indexOf("CommandPaletteFindPageSearch"),
    );
  });
});
