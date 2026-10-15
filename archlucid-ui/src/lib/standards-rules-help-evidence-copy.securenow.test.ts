import { describe, expect, it } from "vitest";

import {
  resolveStandardsRulesHelpSources,
  SECURENOW_STANDARDS_RULES_HELP_SOURCES,
} from "@/lib/standards-rules-help-evidence-copy";

describe("standards rules help evidence copy SecureNow", () => {
  it("omits architecture review follow-ups", () => {
    expect(resolveStandardsRulesHelpSources("security")).toEqual(SECURENOW_STANDARDS_RULES_HELP_SOURCES);
    expect(
      resolveStandardsRulesHelpSources("security").some((source) => source.label.toLowerCase().includes("review")),
    ).toBe(false);
  });
});
