import { describe, expect, it } from "vitest";

import {
  SYSTEM_HEALTH_PAGE_SUBTITLE_BUYER,
  SYSTEM_HEALTH_PAGE_SUBTITLE_OPERATOR,
  systemHealthPageSubtitle,
} from "@/lib/system-health-page-copy";

describe("system-health-page-copy", () => {
  it("uses shorter buyer subtitle", () => {
    expect(systemHealthPageSubtitle(true)).toBe(SYSTEM_HEALTH_PAGE_SUBTITLE_BUYER);
    expect(systemHealthPageSubtitle(false)).toBe(SYSTEM_HEALTH_PAGE_SUBTITLE_OPERATOR);
    expect(SYSTEM_HEALTH_PAGE_SUBTITLE_BUYER.length).toBeLessThan(SYSTEM_HEALTH_PAGE_SUBTITLE_OPERATOR.length);
  });
});
