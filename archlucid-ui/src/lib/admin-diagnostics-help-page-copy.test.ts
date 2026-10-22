import { describe, expect, it } from "vitest";

import {
  ADMIN_DIAGNOSTICS_HELP_BUYER_OVERVIEW,
  ADMIN_DIAGNOSTICS_HELP_PAGE_LEAD,
  ADMIN_DIAGNOSTICS_HELP_START_HERE_HELPER,
} from "@/lib/admin-diagnostics-help-page-copy";

describe("admin-diagnostics-help-page-copy", () => {
  it("keeps buyer overview distinct from page lead and start-here helper", () => {
    expect(ADMIN_DIAGNOSTICS_HELP_BUYER_OVERVIEW).not.toBe(ADMIN_DIAGNOSTICS_HELP_PAGE_LEAD);
    expect(ADMIN_DIAGNOSTICS_HELP_BUYER_OVERVIEW).not.toBe(ADMIN_DIAGNOSTICS_HELP_START_HERE_HELPER);
  });
});
