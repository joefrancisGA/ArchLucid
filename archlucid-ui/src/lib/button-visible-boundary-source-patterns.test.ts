import { describe, expect, it } from "vitest";

import {
  findButtonClassNameColorOverrideViolations,
  findButtonSemanticColorOverrideViolations,
} from "@/lib/button-visible-boundary-source-patterns";

describe("button visible-boundary source patterns (TB-2295)", () => {
  it("flags semantic rose/amber/emerald Button className overrides", () => {
    const source = '<Button className="bg-rose-700 text-white">Delete</Button>';

    expect(findButtonSemanticColorOverrideViolations(source)).not.toEqual([]);
    expect(findButtonClassNameColorOverrideViolations(source)).not.toEqual([]);
  });

  it("flags neutral text and border tint overrides on Button className", () => {
    const source =
      '<Button variant="outline" className="text-neutral-600 dark:text-neutral-400">Dismiss</Button>';

    expect(findButtonSemanticColorOverrideViolations(source)).toEqual([]);
    expect(findButtonClassNameColorOverrideViolations(source)).not.toEqual([]);
  });

  it("allows layout-only Button className utilities", () => {
    const source = '<Button variant="primary" className="mt-2 h-8 w-full shrink-0">Continue</Button>';

    expect(findButtonClassNameColorOverrideViolations(source)).toEqual([]);
  });
});
