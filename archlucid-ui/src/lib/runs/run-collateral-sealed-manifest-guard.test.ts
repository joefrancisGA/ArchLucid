import { describe, expect, it } from "vitest";

import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";

describe("run-collateral-sealed-manifest-guard", () => {
  it("blocks when manifest version is missing", () => {
    expect(
      runCollateralSealedManifestCopyBlockedReason({
        runId: "run-1",
        manifestVersion: null,
      }),
    ).toContain("committed sealed manifest");
  });

  it("allows when run id and manifest version are present", () => {
    expect(
      runCollateralSealedManifestCopyBlockedReason({
        runId: "run-1",
        manifestVersion: "v12",
      }),
    ).toBeNull();
  });
});
