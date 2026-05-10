import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/operator-static-demo", () => ({
  isDemoRunIdEligibleForStaticFallback: vi.fn(),
}));

import { isDemoRunIdEligibleForStaticFallback } from "@/lib/operator-static-demo";
import { findingLinkedManifestDetailHrefForRun } from "@/lib/finding-linked-manifest-href";
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("findingLinkedManifestDetailHrefForRun", () => {
  it("returns manifest href for eligible static demo runs", () => {
    vi.mocked(isDemoRunIdEligibleForStaticFallback).mockReturnValue(true);

    expect(findingLinkedManifestDetailHrefForRun(SHOWCASE_STATIC_DEMO_RUN_ID)).toBe(
      `/manifests/${encodeURIComponent(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}`,
    );
  });

  it("returns null when the run is not a static demo spine", () => {
    vi.mocked(isDemoRunIdEligibleForStaticFallback).mockReturnValue(false);

    expect(findingLinkedManifestDetailHrefForRun("other-run")).toBeNull();
  });
});
