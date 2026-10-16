import { describe, expect, it } from "vitest";

import { formatSandboxStyleGoldenManifest } from "./export-markdown-sandbox-manifest";

describe("formatSandboxStyleGoldenManifest", () => {
  it("distinguishes omitted and stored-empty environment values", () => {
    const omitted = formatSandboxStyleGoldenManifest({});
    const storedEmpty = formatSandboxStyleGoldenManifest({ environment: "" });
    const stored = formatSandboxStyleGoldenManifest({ environment: "Production" });

    expect(omitted).toContain("Environment was not stored.");
    expect(storedEmpty).toContain("- **Environment:** ");
    expect(storedEmpty).not.toContain("Environment was not stored.");
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

  it("distinguishes omitted and stored-empty highlight dispositions", () => {
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
    expect(storedEmpty).toContain("- **Disposition:** ");
    expect(storedEmpty).not.toContain("Disposition was not stored.");
    expect(stored).toContain("- **Disposition:** Accepted");
  });
});
