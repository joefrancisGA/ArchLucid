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

  it("explains when status is omitted", () => {
    expect(manifestStatusForDisplay("")).toBe("Status not returned");
    expect(manifestStatusForDisplay(null)).toBe("Status not returned");
  });
});

describe("isReviewManifestFinalized", () => {
  it("returns true only for committed authority status", () => {
    expect(isReviewManifestFinalized("Committed")).toBe(true);
    expect(isReviewManifestFinalized("Draft")).toBe(false);
    expect(isReviewManifestFinalized(null)).toBe(false);
  });
});
