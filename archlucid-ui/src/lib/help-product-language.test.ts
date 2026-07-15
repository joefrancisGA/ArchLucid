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
    expect(output.toLowerCase()).toContain("review not ready");
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
