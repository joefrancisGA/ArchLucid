import { describe, expect, it } from "vitest";

import { SECURENOW_ACCELERATOR_HOME_QUICK_ROWS } from "@/lib/product-line/securenow-accelerator-home-quick-rows";
import { SECURENOW_SPECIALTY_TEMPLATES_HREF } from "@/lib/product-line/securenow-accelerator-template-links";

describe("securenow-accelerator-home-quick-rows", () => {
  it("exposes specialty templates and fixture-path-03 quick links", () => {
    expect(SECURENOW_ACCELERATOR_HOME_QUICK_ROWS.some((row) => row.href === SECURENOW_SPECIALTY_TEMPLATES_HREF)).toBe(true);
    expect(
      SECURENOW_ACCELERATOR_HOME_QUICK_ROWS.some((row) => row.href.includes("fixture-path-03")),
    ).toBe(true);
  });
});
