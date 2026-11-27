import { describe, expect, it } from "vitest";

import { SECURENOW_PINNED_ACCELERATOR_PATHS_LEAD } from "@/lib/product-line/securenow-pinned-accelerator-paths";
import { SECURENOW_SPECIALTY_TEMPLATE_GRID_FOOTER_LINE } from "@/lib/help/securenow-specialty-template-grid-footer-copy";

describe("score lift round145 wave D honesty", () => {
  it("does not imply tenant bookmarks or SKU entitlements", () => {
    expect(SECURENOW_PINNED_ACCELERATOR_PATHS_LEAD).toContain("not tenant bookmarks");
    expect(SECURENOW_SPECIALTY_TEMPLATE_GRID_FOOTER_LINE).toContain("not imply licensed customer data");
  });
});
