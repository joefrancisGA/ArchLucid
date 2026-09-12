import { describe, expect, it } from "vitest";

import {
  DAYTIME_WAIT_WORKING_BACKGROUND_WAIT_HELPER,
  resolveDaytimeWaitWorkingInProgressBridgeCopy,
} from "@/lib/daytime-wait-never-stay-on-page-working";

describe("daytime-wait never stay on this page Working (DW-003)", () => {
  it("Working in-progress guidance does not say stay on this page", () => {
    const bridgeCopy = resolveDaytimeWaitWorkingInProgressBridgeCopy();

    expect(bridgeCopy).not.toMatch(/stay on this page/i);
    expect(bridgeCopy).toMatch(/activity/i);
  });

  it("background wait helper does not say stay on this page", () => {
    expect(DAYTIME_WAIT_WORKING_BACKGROUND_WAIT_HELPER).not.toMatch(/stay on this page/i);
    expect(DAYTIME_WAIT_WORKING_BACKGROUND_WAIT_HELPER).toMatch(/background/i);
  });
});
