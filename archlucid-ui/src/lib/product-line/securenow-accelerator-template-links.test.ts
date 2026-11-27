import { describe, expect, it } from "vitest";

import {
  SECURENOW_GOLDEN_SPONSOR_WALKTHROUGH_HREF,
  SECURENOW_SPECIALTY_TEMPLATES_HREF,
} from "@/lib/product-line/securenow-accelerator-template-links";
import { GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_QUERY } from "@/lib/golden-sponsor-package-walkthrough";

describe("securenow-accelerator-template-links", () => {
  it("exposes specialty templates and golden sponsor walkthrough hrefs", () => {
    expect(SECURENOW_SPECIALTY_TEMPLATES_HREF).toBe("/help/specialty-walkthroughs");
    expect(SECURENOW_GOLDEN_SPONSOR_WALKTHROUGH_HREF).toContain(GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_QUERY);
    expect(SECURENOW_GOLDEN_SPONSOR_WALKTHROUGH_HREF).toContain("sponsor-handoff");
  });
});
