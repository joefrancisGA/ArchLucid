import { describe, expect, it } from "vitest";

import {
  applyHelpProductLanguage,
  helpProductLanguageDriftDetected,
  rewriteLegacyHelpOperatorRoutes,
} from "@/lib/help-product-language";

describe("help-product-language", () => {
  it("rewrites legacy /runs/ operator routes to /reviews/", () => {
    expect(rewriteLegacyHelpOperatorRoutes("Open [`/runs/run-1`](/runs/run-1) from the shell.")).toBe(
      "Open [`/reviews/run-1`](/reviews/run-1) from the shell.",
    );
  });

  it("normalizes manifest and run-primary phrasing for help surfaces", () => {
    const normalized = applyHelpProductLanguage(
      "An empty artifact list can be valid: manifest exists but no files yet. Architecture run execution failed. See [/runs/new](/runs/new).",
    );

    expect(normalized).toContain("review package exists");
    expect(normalized.toLowerCase()).toContain("architecture review execution failed");
    expect(normalized).toContain("](/reviews/new)");
    expect(normalized.includes("/runs/")).toBe(false);
  });

  it("detects drift when golden manifest or legacy routes remain", () => {
    expect(helpProductLanguageDriftDetected("See the golden manifest at /runs/abc")).toBe(true);
    expect(helpProductLanguageDriftDetected("Review package summary")).toBe(false);
  });
});
