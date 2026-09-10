import { describe, expect, it } from "vitest";

import {
  ACCELERATOR_CHOOSER_HELP_BUYER_OVERVIEW,
  ACCELERATOR_CHOOSER_HELP_BUYER_START_HERE_HELPER,
  ACCELERATOR_CHOOSER_HELP_PAGE_LEAD,
} from "@/lib/accelerator-chooser-help-page-copy";

describe("accelerator-chooser-help-page-copy", () => {
  it("keeps buyer overview distinct from page lead and start-here helper", () => {
    expect(ACCELERATOR_CHOOSER_HELP_BUYER_OVERVIEW).not.toBe(ACCELERATOR_CHOOSER_HELP_PAGE_LEAD);
    expect(ACCELERATOR_CHOOSER_HELP_BUYER_OVERVIEW).not.toBe(ACCELERATOR_CHOOSER_HELP_BUYER_START_HERE_HELPER);
  });
});
