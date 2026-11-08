import { describe, expect, it } from "vitest";

import { formatSandboxStyleGoldenManifest } from "./export-markdown-sandbox-manifest";

describe("formatSandboxStyleGoldenManifest", () => {
  it("labels missing system name and highlights (P-03)", () => {
    const markdown = formatSandboxStyleGoldenManifest({});

    expect(markdown).toContain("# System name was not stored.");
    expect(markdown).toContain("Highlights were not stored.");
    expect(markdown).not.toContain("Committed architecture review record");
    expect(markdown).not.toContain("from embedded highlights");
  });

    it("distinguishes omitted and stored-empty environment values (P-04)", () => {
    const omitted = formatSandboxStyleGoldenManifest({});
    const storedEmpty = formatSandboxStyleGoldenManifest({ environment: "" });
    const storedWhitespace = formatSandboxStyleGoldenManifest({ environment: "   " });
    const stored = formatSandboxStyleGoldenManifest({ environment: "Production" });

    expect(omitted).toContain("Environment was not stored.");
    expect(storedEmpty).toContain("Environment was stored empty.");
    expect(storedWhitespace).toContain("Environment was stored empty.");
    expect(storedEmpty).not.toContain("- **Environment:** ");
    expect(stored).toContain("- **Environment:** Production");
  });

  it("labels missing summary counts when keys are present (P-20)", () => {
    const markdown = formatSandboxStyleGoldenManifest({
      summary: {
        decisionCount: null,
        unresolvedIssueCount: 2,
      },
    });

    expect(markdown).toContain("Decision count was not stored.");
    expect(markdown).not.toContain("Warning count was not stored.");
    expect(markdown).toContain("- **Unresolved issues:** 2");
  });

  it("distinguishes omitted and stored-empty highlight dispositions (P-04)", () => {
    const omitted = formatSandboxStyleGoldenManifest({
      highlights: [{ title: "Decision", disposition: undefined }],
    });
    const storedEmpty = formatSandboxStyleGoldenManifest({
      highlights: [{ title: "Decision", disposition: "" }],
    });
    const stored = formatSandboxStyleGoldenManifest({
      highlights: [{ title: "Decision", disposition: "Accepted" }],
    });

    expect(omitted).toContain("Disposition was not stored.");
    expect(storedEmpty).toContain("Disposition was stored empty.");
    expect(storedEmpty).not.toContain("Disposition was not stored.");
    expect(stored).toContain("- **Disposition:** Accepted");
  });

  it("labels missing cloud, status, warnings, and highlight title (P-04)", () => {
    const markdown = formatSandboxStyleGoldenManifest({
      systemName: "Claims API",
      environment: "Production",
      highlights: [{ disposition: "Accepted" }],
      warnings: null,
    });

    expect(markdown).toContain("- Cloud was not stored.");
    expect(markdown).toContain("- Status was not stored.");
    expect(markdown).toContain("Warnings were not stored.");
    expect(markdown).toContain("Highlight title was not stored.");
    expect(markdown).toContain("- **Disposition:** Accepted");
  });

  it("labels missing highlight category and rationale", () => {
    const markdown = formatSandboxStyleGoldenManifest({
      highlights: [{ title: "Decision", disposition: "Accepted" }],
    });

    expect(markdown).toContain("Category was not stored.");
    expect(markdown).toContain("Rationale was not stored.");
  });

  it("keeps empty warnings list copy separate from null warnings", () => {
    const markdown = formatSandboxStyleGoldenManifest({
      systemName: "Claims API",
      warnings: [],
    });

    expect(markdown).toContain("_No warnings were listed on the review record._");
    expect(markdown).not.toContain("Warnings were not stored.");
  });
});
