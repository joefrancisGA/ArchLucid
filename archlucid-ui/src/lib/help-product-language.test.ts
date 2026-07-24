import { describe, expect, it } from "vitest";

import {
  applyHelpTopicProductLanguage,
  HELP_TOPIC_BANNED_COPY_PATTERNS,
  rewriteLegacyHelpOperatorRoutes,
} from "@/lib/help-product-language";

describe("help-product-language", () => {
  it("rewrites legacy /runs/ paths to /reviews/", () => {
    expect(rewriteLegacyHelpOperatorRoutes("Open `/runs/abc` or [detail](/runs/abc).")).toBe(
      "Open `/reviews/abc` or [detail](/reviews/abc).",
    );
  });

  it("rewrites review manifest routes to signed-record alias", () => {
    expect(rewriteLegacyHelpOperatorRoutes("[Summary](/reviews/abc/manifest)")).toBe(
      "[Summary](/reviews/abc/signed-record)",
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
    expect(output.toLowerCase()).toContain("signed review record");
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
