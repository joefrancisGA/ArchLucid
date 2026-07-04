import { describe, expect, it } from "vitest";

import { governanceModeVocabulary } from "@/lib/governance-mode-vocabulary";

describe("governanceModeVocabulary", () => {
  it("uses pilot-friendly labels when governance view is off", () => {
    const vocabulary = governanceModeVocabulary(false);

    expect(vocabulary.reviewPlural).toBe("Review packages");
    expect(vocabulary.goldenManifestLabel).toBe("Approved design");
    expect(vocabulary.authorityChainLabel).toBe("Review steps");
  });

  it("uses enterprise governance labels when governance view is on", () => {
    const vocabulary = governanceModeVocabulary(true);

    expect(vocabulary.reviewPlural).toBe("Runs");
    expect(vocabulary.goldenManifestLabel).toBe("Signed review record");
    expect(vocabulary.authorityChainLabel).toBe("Authority chain");
  });
});
