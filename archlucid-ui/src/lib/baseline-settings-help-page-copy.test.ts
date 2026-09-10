import { describe, expect, it } from "vitest";

import {
  BASELINE_SETTINGS_HELP_BUYER_OVERVIEW,
  BASELINE_SETTINGS_HELP_PAGE_LEAD,
} from "@/lib/baseline-settings-help-page-copy";
import { BASELINE_SETTINGS_HELP_BUYER_START_HERE_HELPER } from "@/lib/baseline-settings-help-guide-content";

describe("baseline-settings-help-page-copy", () => {
  it("keeps buyer overview distinct from page lead and start-here helper", () => {
    expect(BASELINE_SETTINGS_HELP_BUYER_OVERVIEW).not.toBe(BASELINE_SETTINGS_HELP_PAGE_LEAD);
    expect(BASELINE_SETTINGS_HELP_BUYER_OVERVIEW).not.toBe(BASELINE_SETTINGS_HELP_BUYER_START_HERE_HELPER);
  });
});
