import { describe, expect, it } from "vitest";

import {
  trustEvidenceGoldenManifestFieldTitle,
  trustEvidenceProofChainManifestStepLabel,
} from "./trust-evidence-display";

describe("trust-evidence-display", () => {
  it("uses signed review record label on buyer-polished proof chain step", () => {
    expect(trustEvidenceProofChainManifestStepLabel(true)).toBe("Signed review record");
    expect(trustEvidenceProofChainManifestStepLabel(false)).toBe("Manifest");
  });

  it("maps golden manifest snapshot titles for buyer-polished field rows", () => {
    expect(trustEvidenceGoldenManifestFieldTitle("Golden manifest snapshot", true)).toBe(
      "Signed review record",
    );
    expect(trustEvidenceGoldenManifestFieldTitle("Golden manifest snapshot", false)).toBe(
      "Golden manifest snapshot",
    );
  });
});
