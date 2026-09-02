import { describe, expect, it } from "vitest";

import {
  homeGovernanceWarningsClearHrefFromSearch,
  homeGovernanceWarningsHrefFromSearch,
  homeGovernanceWarningsQueryEnabled,
} from "@/components/operator-home/runs-dashboard-panel-presentation";

describe("home governance warnings URL helpers", () => {
  it("detects warnings query param", () => {
    expect(homeGovernanceWarningsQueryEnabled(new URLSearchParams("warnings=1"))).toBe(true);
    expect(homeGovernanceWarningsQueryEnabled(new URLSearchParams("warnings=true"))).toBe(true);
    expect(homeGovernanceWarningsQueryEnabled(new URLSearchParams())).toBe(false);
  });

  it("writes and clears warnings query param", () => {
    expect(homeGovernanceWarningsHrefFromSearch("")).toBe("/?warnings=1");
    expect(homeGovernanceWarningsHrefFromSearch("tab=attention")).toBe("/?tab=attention&warnings=1");
    expect(homeGovernanceWarningsClearHrefFromSearch("warnings=1&tab=attention")).toBe("/?tab=attention");
  });
});
