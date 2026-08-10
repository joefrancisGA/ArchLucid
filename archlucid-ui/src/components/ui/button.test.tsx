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

  it("renders visible boundaries for fill and outline variants", () => {
    expect(buttonVariants({ variant: "outline" })).toContain("border");
    expect(buttonVariants({ variant: "primary" })).toContain("bg-");
    expect(buttonVariants({ variant: "default" })).toContain("bg-");
    expect(buttonVariants({ variant: "secondary" })).toContain("bg-");
    expect(buttonVariants({ variant: "destructive" })).toContain("bg-");
  });
});
