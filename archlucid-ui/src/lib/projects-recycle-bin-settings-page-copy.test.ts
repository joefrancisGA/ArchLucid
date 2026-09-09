import { describe, expect, it } from "vitest";

import {
  PROJECTS_RECYCLE_BIN_SETTINGS_BUYER_OVERVIEW,
  PROJECTS_RECYCLE_BIN_SETTINGS_BUYER_START_HERE_HELPER,
  PROJECTS_RECYCLE_BIN_SETTINGS_PAGE_LEAD,
} from "@/lib/projects-recycle-bin-settings-page-copy";

describe("projects-recycle-bin-settings-page-copy", () => {
  it("keeps buyer overview distinct from page lead and start-here helper", () => {
    expect(PROJECTS_RECYCLE_BIN_SETTINGS_BUYER_OVERVIEW).not.toBe(PROJECTS_RECYCLE_BIN_SETTINGS_PAGE_LEAD);
    expect(PROJECTS_RECYCLE_BIN_SETTINGS_BUYER_OVERVIEW).not.toBe(PROJECTS_RECYCLE_BIN_SETTINGS_BUYER_START_HERE_HELPER);
  });
});
