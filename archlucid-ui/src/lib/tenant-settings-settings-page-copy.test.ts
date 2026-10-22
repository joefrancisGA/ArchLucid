import { describe, expect, it } from "vitest";

import {
  TENANT_SETTINGS_SETTINGS_BUYER_OVERVIEW,
  TENANT_SETTINGS_SETTINGS_BUYER_START_HERE_HELPER,
  TENANT_SETTINGS_SETTINGS_PAGE_LEAD,
} from "@/lib/tenant-settings-settings-page-copy";

describe("tenant-settings-settings-page-copy", () => {
  it("keeps buyer overview distinct from page lead and start-here helper", () => {
    expect(TENANT_SETTINGS_SETTINGS_BUYER_OVERVIEW).not.toBe(TENANT_SETTINGS_SETTINGS_PAGE_LEAD);
    expect(TENANT_SETTINGS_SETTINGS_BUYER_OVERVIEW).not.toBe(TENANT_SETTINGS_SETTINGS_BUYER_START_HERE_HELPER);
  });
});
