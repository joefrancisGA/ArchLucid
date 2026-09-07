import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { resolveWorkingStartHref } from "@/lib/working-start-route";

describe("working start route architecture locator guard (AO-47)", () => {
  it("does not import reviewDetailPath in the production resolver", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/lib/working-start-route.ts"),
      "utf8",
    );

    expect(source).not.toContain("reviewDetailPath");
    expect(source).not.toMatch(/\/architecture\/reviews\//);
  });

  it("never returns a peer review path for any resolver input", () => {
    const cases = [
      resolveWorkingStartHref({ lastOpenArchitectureId: "arch-1" }),
      resolveWorkingStartHref({ inFlightParentArchitectureId: "arch-2" }),
      resolveWorkingStartHref({}),
      resolveWorkingStartHref({
        lastOpenArchitectureId: "arch-3",
        inFlightParentArchitectureId: "arch-4",
      }),
    ];

    for (const result of cases) {
      expect(result.href).not.toMatch(/^\/architecture\/reviews\/[^/]+$/);
    }
  });
});
