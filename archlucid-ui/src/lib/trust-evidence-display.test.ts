import { describe, expect, it } from "vitest";

import {
  trustEvidenceGoldenManifestFieldDetail,
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

  it("maps golden manifest snapshot detail for buyer-polished field rows", () => {
    expect(trustEvidenceGoldenManifestFieldDetail("Golden manifest snapshot detail", true)).toBe(
      "Signed review record snapshot detail",
    );
    expect(trustEvidenceGoldenManifestFieldDetail("Golden manifest snapshot detail", false)).toBe(
      "Golden manifest snapshot detail",
    );
  });
});
