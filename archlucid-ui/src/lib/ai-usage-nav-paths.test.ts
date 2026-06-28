import { describe, expect, it } from "vitest";

import {
  AI_USAGE_COST_REPORTING_PATH,
  AI_USAGE_LEGACY_ADMIN_PATH,
  AI_USAGE_SETTINGS_PATH,
  pathMatchesAiUsageSettings,
} from "@/lib/ai-usage-nav-paths";

describe("ai-usage-nav-paths (TB-408)", () => {
  it("exposes canonical AI usage settings path under /settings/ai-usage", () => {
    expect(AI_USAGE_SETTINGS_PATH).toBe("/settings/ai-usage");
    expect(AI_USAGE_COST_REPORTING_PATH).toBe("/settings/cost-reporting");
  });

  it("matches canonical and legacy AI usage paths", () => {
    expect(pathMatchesAiUsageSettings("/settings/ai-usage")).toBe(true);
    expect(pathMatchesAiUsageSettings("/settings/cost-reporting")).toBe(true);
    expect(pathMatchesAiUsageSettings("/admin/ai-usage-cost")).toBe(true);
  });

  it("documents legacy redirect sources", () => {
    expect(AI_USAGE_LEGACY_ADMIN_PATH).toBe("/admin/ai-usage-cost");
  });
});
