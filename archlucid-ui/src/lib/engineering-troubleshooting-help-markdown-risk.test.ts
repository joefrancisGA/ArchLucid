import { describe, expect, it } from "vitest";

import { resolveEngineeringTroubleshootingMarkdownSectionRisk } from "@/lib/engineering-troubleshooting-help-markdown-risk";

describe("resolveEngineeringTroubleshootingMarkdownSectionRisk", () => {
  it("flags migration and restart guidance", () => {
    const risk = resolveEngineeringTroubleshootingMarkdownSectionRisk(
      "API startup",
      "Confirm the database is reachable, then restart the API after applying DbUp migrations.",
    );

    expect(risk).not.toBeNull();
    expect(risk?.kind).toBe("warn");
  });

  it("returns null for neutral sections", () => {
    expect(
      resolveEngineeringTroubleshootingMarkdownSectionRisk("Quick matrix", "Verify review ID and tenant scope."),
    ).toBeNull();
  });
});
