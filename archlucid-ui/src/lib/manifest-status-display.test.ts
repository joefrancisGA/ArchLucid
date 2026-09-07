import { describe, expect, it } from "vitest";

import { manifestStatusForDisplay, isReviewManifestFinalized } from "@/lib/manifest-status-display";

describe("manifestStatusForDisplay", () => {
  it("maps committed to Finalized", () => {
    expect(manifestStatusForDisplay("Committed")).toBe("Finalized");
    expect(manifestStatusForDisplay("committed")).toBe("Finalized");
  });

  it("passes through other statuses", () => {
    expect(manifestStatusForDisplay("Draft")).toBe("Draft");
  });

  it("returns em dash when empty", () => {
    expect(manifestStatusForDisplay("")).toBe(" — ");
    expect(manifestStatusForDisplay(null)).toBe(" — ");
  });
});

describe("isReviewManifestFinalized", () => {
  it("returns true only for committed authority status", () => {
    expect(isReviewManifestFinalized("Committed")).toBe(true);
    expect(isReviewManifestFinalized("Draft")).toBe(false);
    expect(isReviewManifestFinalized(null)).toBe(false);
  });
});
