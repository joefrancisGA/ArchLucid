import { describe, expect, it } from "vitest";

import { helpEngineeringTroubleshootingSymptomRunbookHrefFromSearch } from "@/lib/help/help-engineering-troubleshooting-symptom-runbook-url";

describe("help-engineering-troubleshooting-symptom-runbook-url", () => {
  it("sets disclosure param and hash for symptom deep links", () => {
    expect(
      helpEngineeringTroubleshootingSymptomRunbookHrefFromSearch(
        "q=401",
        "3-401-unauthorized-everywhere",
        "/help/engineering-troubleshooting",
      ),
    ).toBe(
      "/help/engineering-troubleshooting?q=401&helpEngineeringTroubleshootingMarkdownSectionKey=3-401-unauthorized-everywhere#3-401-unauthorized-everywhere",
    );
  });
});
