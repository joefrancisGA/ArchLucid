import { describe, expect, it } from "vitest";

import {
  trustEvidenceGoldenManifestFieldDetail,
  trustEvidenceGoldenManifestFieldTitle,
  trustEvidenceProofChainManifestStepLabel,
} from "./trust-evidence-display";

describe("trust-evidence-display", () => {
  it("uses finalized review record label on proof chain step", () => {
    expect(trustEvidenceProofChainManifestStepLabel()).toBe("Finalized review record");
  });

  it("maps golden manifest snapshot titles for buyer-polished field rows", () => {
    expect(trustEvidenceGoldenManifestFieldTitle("Golden manifest snapshot", true)).toBe(
      "Finalized review record",
    );
    expect(trustEvidenceGoldenManifestFieldTitle("Golden manifest snapshot", false)).toBe(
      "Finalized review record",
    );
  });

  it("maps golden manifest snapshot detail for buyer-polished field rows", () => {
    expect(trustEvidenceGoldenManifestFieldDetail("Golden manifest snapshot detail")).toBe(
      "Finalized review record snapshot detail",
    );
  });
});
