import { describe, expect, it } from "vitest";

import {
  applyHelpTopicProductLanguage,
  HELP_TOPIC_BANNED_COPY_PATTERNS,
  rewriteLegacyHelpOperatorRoutes,
} from "@/lib/help/help-product-language";

describe("help-product-language", () => {
  it("rewrites legacy /runs/ paths to /architecture/reviews/", () => {
    expect(rewriteLegacyHelpOperatorRoutes("Open `/runs/abc` or [detail](/runs/abc).")).toBe(
      "Open `/architecture/reviews/abc` or [detail](/architecture/reviews/abc).",
    );
  });

  it("rewrites legacy /reviews/ paths to /architecture/reviews/ without double-prefixing", () => {
    expect(rewriteLegacyHelpOperatorRoutes("Open `/reviews/abc` or [detail](/reviews/abc).")).toBe(
      "Open `/architecture/reviews/abc` or [detail](/architecture/reviews/abc).",
    );
    expect(rewriteLegacyHelpOperatorRoutes("[List](/reviews) and [New](/reviews/new)")).toBe(
      "[List](/architecture/reviews) and [New](/architecture/reviews/new)",
    );
    expect(rewriteLegacyHelpOperatorRoutes("[Already](/architecture/reviews/abc)")).toBe(
      "[Already](/architecture/reviews/abc)",
    );
  });

  it("rewrites review manifest routes to review detail", () => {
    expect(rewriteLegacyHelpOperatorRoutes("[Summary](/architecture/reviews/abc/manifest)")).toBe(
      "[Summary](/architecture/reviews/abc)",
    );
  });

  it("rewrites legacy signed-records paths to governance canonical", () => {
    expect(rewriteLegacyHelpOperatorRoutes("[Record](/signed-records/abc) and [list](/signed-records)")).toBe(
      "[Record](/governance/sealed-records/abc) and [list](/governance/sealed-records)",
    );
    expect(rewriteLegacyHelpOperatorRoutes("[Manifest](/manifests/abc/artifacts/x)")).toBe(
      "[Manifest](/governance/sealed-records/abc/artifacts/x)",
    );
  });

  it("rewrites legacy workspace security-trust path to administration canonical", () => {
    expect(rewriteLegacyHelpOperatorRoutes("Open [Security & Trust](/workspace/security-trust)")).toBe(
      "Open [Security & Trust](/administration/security-trust)",
    );
  });

  it("rewrites legacy settings roles path to users hub roles tab", () => {
    expect(rewriteLegacyHelpOperatorRoutes("Manage [Roles](/settings/roles)")).toBe(
      "Manage [Roles](/administration/users?tab=roles)",
    );
  });

  it("maps manifest and run jargon to product language", () => {
    const input =
      "manifest exists for that manifest; golden manifest summary; RunId=abc; run not ready for commit.";
    const output = applyHelpTopicProductLanguage(input);

    expect(output.toLowerCase()).not.toContain("golden manifest");
    expect(output).toContain("ReviewId=abc");
    expect(output.toLowerCase()).toContain("review not ready to finalize");
    expect(output.toLowerCase()).toContain("review exists");
    expect(output.toLowerCase()).toContain("sealed review record");
  });

  it("preserves Architecture package and does not collapse it to architecture review", () => {
    const input = "Finalize the architecture package after the architecture review completes.";
    const output = applyHelpTopicProductLanguage(input);

    expect(output.toLowerCase()).toContain("architecture package");
    expect(output.toLowerCase()).toContain("architecture review");
  });

  it("maps review package and operator shell to buyer nouns", () => {
    const output = applyHelpTopicProductLanguage(
      "Open the review package in the operator shell after the pilot operator finishes.",
    );

    expect(output.toLowerCase()).toContain("architecture package");
    expect(output.toLowerCase()).toContain("architect workspace");
    expect(output.toLowerCase()).not.toContain("review package");
    expect(output.toLowerCase()).not.toContain("operator shell");
  });

  it("preserves extractor manifest.json filenames", () => {
    const input = "Validate ZIP contains `manifest.json` before upload.";

    expect(applyHelpTopicProductLanguage(input)).toContain("manifest.json");
  });

  it("strips product version labels from buyer help copy", () => {
    // The trailing sentence keeps the bare-`V1` catch-all covered: `**V1** assurance` and
    // `V1 GA` have dedicated rewrites, so only an unqualified `V1` reaches the product-name swap.
    const input =
      "**V1** assurance includes owner-conducted testing. Tier 2 is opt-in and not required for V1 pilots. Status: V1 GA — aligns with product scope. V1 supports hosted tenants.";
    const output = applyHelpTopicProductLanguage(input);

    expect(output).not.toMatch(/\bV1\b/);
    expect(output.toLowerCase()).toContain("archlucid");
    expect(output.toLowerCase()).toContain("generally available");
  });
});

describe("help topic banned copy guard", () => {
  it("prepared troubleshooting excerpt avoids banned manifest/run fragments", () => {
    const sample =
      "An empty artifact list can be valid: review exists but no synthesized files yet.";
    const prepared = applyHelpTopicProductLanguage(sample).toLowerCase();

    for (const pattern of HELP_TOPIC_BANNED_COPY_PATTERNS) {
      expect(prepared, `should not contain "${pattern}"`).not.toContain(pattern);
    }
  });
});
