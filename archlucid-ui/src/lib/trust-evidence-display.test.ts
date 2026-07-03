import { describe, expect, it } from "vitest";

import {
  trustEvidenceGoldenManifestFieldDetail,
  trustEvidenceGoldenManifestFieldTitle,
  trustEvidenceProofChainManifestStepLabel,
} from "./trust-evidence-display";

describe("trust-evidence-display", () => {
  it("uses signed review record label on proof chain step", () => {
    expect(trustEvidenceProofChainManifestStepLabel()).toBe("Signed review record");
  });

  it("maps golden manifest snapshot titles for buyer-polished field rows", () => {
    expect(trustEvidenceGoldenManifestFieldTitle("Golden manifest snapshot", true)).toBe(
      "Signed review record",
    );
    expect(trustEvidenceGoldenManifestFieldTitle("Golden manifest snapshot", false)).toBe(
      "Signed review record",
    );
  });

  it("maps golden manifest snapshot detail for buyer-polished field rows", () => {
    expect(trustEvidenceGoldenManifestFieldDetail("Golden manifest snapshot detail")).toBe(
      "Signed review record snapshot detail",
    );
  });
});
