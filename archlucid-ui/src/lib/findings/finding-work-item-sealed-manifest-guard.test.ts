import { describe, expect, it } from "vitest";

import { findingWorkItemSealedManifestCopyBlockedReason } from "@/lib/findings/finding-work-item-sealed-manifest-guard";

describe("finding-work-item-sealed-manifest-guard", () => {
  it("allows copy when run id and manifest version are present", () => {
    expect(
      findingWorkItemSealedManifestCopyBlockedReason({
        runId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        manifestVersion: "mv-1",
      }),
    ).toBeNull();
  });

  it("blocks copy when manifest version is missing", () => {
    expect(
      findingWorkItemSealedManifestCopyBlockedReason({
        runId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        manifestVersion: "  ",
      }),
    ).toContain("sealed manifest");
  });
});
