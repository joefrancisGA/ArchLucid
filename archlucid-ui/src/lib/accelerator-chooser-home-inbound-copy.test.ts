import { describe, expect, it } from "vitest";

import {
  ACCELERATOR_CHOOSER_HOME_CARD_LEAD,
  ACCELERATOR_CHOOSER_HOME_CARD_TITLE,
  ACCELERATOR_CHOOSER_HOME_GUIDANCE_HREF,
  ACCELERATOR_CHOOSER_HOME_GUIDANCE_LINK_LABEL,
  ACCELERATOR_CHOOSER_HOME_HELP_SLUG,
} from "@/lib/accelerator-chooser-home-inbound-copy";
import { ACCELERATOR_CHOOSER_HELP_PAGE_TITLE } from "@/lib/accelerator-chooser-help-guide-content";

describe("accelerator chooser home inbound copy (TB-1608)", () => {
  it("aligns home card title with specialty help page title", () => {
    expect(ACCELERATOR_CHOOSER_HOME_CARD_TITLE).toBe(ACCELERATOR_CHOOSER_HELP_PAGE_TITLE);
  });

  it("routes home guidance to the accelerator-chooser help slug", () => {
    expect(ACCELERATOR_CHOOSER_HOME_HELP_SLUG).toBe("accelerator-chooser");
    expect(ACCELERATOR_CHOOSER_HOME_GUIDANCE_HREF).toBe("/help/accelerator-chooser");
  });

  it("avoids repository and engineering jargon in buyer-facing home copy", () => {
    const chromeCopy = [
      ACCELERATOR_CHOOSER_HOME_CARD_TITLE,
      ACCELERATOR_CHOOSER_HOME_CARD_LEAD,
      ACCELERATOR_CHOOSER_HOME_GUIDANCE_LINK_LABEL,
    ].join(" ");

    expect(chromeCopy.toLowerCase()).not.toMatch(/\brepo\b/);
    expect(chromeCopy.toLowerCase()).not.toContain("accelerator chooser");
    expect(chromeCopy.toLowerCase()).not.toContain("full accelerator chooser guide");
  });
});
