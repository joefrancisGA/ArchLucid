import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("CommandPalette navigation (LW-077)", () => {
  it("dispatches route changes through router.push so useInAppNavigationGuard can intercept them", () => {
    const source = readFileSync(join(process.cwd(), "src/components/CommandPalette.tsx"), "utf8");

    expect(source).toContain("router.push(href)");
  });
});
