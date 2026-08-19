import { describe, expect, it } from "vitest";

import { governanceModeVocabulary } from "@/lib/vocabulary/governance-mode-vocabulary";

describe("governanceModeVocabulary", () => {
  it("uses pilot-friendly labels when governance view is off", () => {
    const vocabulary = governanceModeVocabulary(false);

    expect(vocabulary.reviewPlural).toBe("Reviews");
    expect(vocabulary.goldenManifestLabel).toBe("Approved design");
    expect(vocabulary.authorityChainLabel).toBe("Review steps");
  });

  it("uses enterprise governance labels when governance view is on", () => {
    const vocabulary = governanceModeVocabulary(true);

    expect(vocabulary.reviewPlural).toBe("Reviews");
    expect(vocabulary.reviewDetailTitle).toBe("Review detail");
    expect(vocabulary.goldenManifestLabel).toBe("Sealed review record");
    expect(vocabulary.authorityChainLabel).toBe("Authority chain");
  });
});
