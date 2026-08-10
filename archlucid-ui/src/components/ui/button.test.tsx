import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buttonVariants } from "@/components/ui/button";

const buttonSource = readFileSync(join(__dirname, "button.tsx"), "utf8");

describe("buttonVariants", () => {
  it("does not define ghost or link variant keys (TB-2168)", () => {
    expect(buttonSource).not.toMatch(/^\s+ghost:/m);
    expect(buttonSource).not.toMatch(/^\s+link:/m);
  });

  it("exports only visible-boundary variant keys (TB-2174)", () => {
    const variantBlock = buttonSource.match(/variant:\s*\{([\s\S]*?)\n\s+\},/);

    expect(variantBlock).not.toBeNull();

    const keys = [...variantBlock![1].matchAll(/^\s+(\w+):/gm)].map((match) => match[1]);

    expect(keys).not.toContain("ghost");
    expect(keys).not.toContain("link");
    expect(keys.sort()).toEqual(["default", "destructive", "outline", "primary", "secondary"]);
  });

  it("renders visible boundaries for fill and outline variants", () => {
    expect(buttonVariants({ variant: "outline" })).toContain("border");
    expect(buttonVariants({ variant: "primary" })).toContain("bg-");
    expect(buttonVariants({ variant: "default" })).toContain("bg-");
    expect(buttonVariants({ variant: "secondary" })).toContain("bg-");
    expect(buttonVariants({ variant: "destructive" })).toContain("bg-");
  });

  it("does not require border classes on filled variants (TB-2174)", () => {
    for (const variant of ["primary", "default", "secondary", "destructive"] as const) {
      const classes = buttonVariants({ variant });

      expect(classes).toMatch(/\bbg-/);
      expect(classes).not.toMatch(/\bborder\b/);
    }
  });
});
