import { describe, expect, it } from "vitest";

import { isPathAllowedForProductLine } from "@/lib/product-line/product-line-path-access";
import { SECURENOW_ACCELERATOR_INDEX_PATH } from "@/lib/product-line/securenow-accelerator-index-copy";

describe("SecureNow administration route access", () => {
  it("lets the security shell open sponsor path and the accelerator index", () => {
    expect(
      isPathAllowedForProductLine("/administration/securenow-sponsor-path?pathId=fixture-path-01", "security"),
    ).toBe(true);
    expect(isPathAllowedForProductLine(SECURENOW_ACCELERATOR_INDEX_PATH, "security")).toBe(true);
    expect(isPathAllowedForProductLine("/administration/securenow-sponsor-path", "architecture")).toBe(false);
    expect(isPathAllowedForProductLine(SECURENOW_ACCELERATOR_INDEX_PATH, "architecture")).toBe(false);
  });
});
