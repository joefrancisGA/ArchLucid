import { describe, expect, it } from "vitest";

import { findingDispositionMutationBlockedReason } from "./finding-disposition-mutation-blocked-reason";

describe("findingDispositionMutationBlockedReason (wave-73 / 867)", () => {
  it("surfaces sealed-manifest lifecycle 409 copy from compareRunPairBlockedReason", () => {
    const blockedReason = findingDispositionMutationBlockedReason({
      message: "Governance disposition blocked because the committed golden manifest hash drifted.",
      httpStatus: 409,
      retryAfterSeconds: null,
      problem: {
        type: "https://archlucid.dev/problems/conflict",
        title: "Conflict",
        status: 409,
        detail: "Governance disposition blocked because the committed golden manifest hash drifted.",
      },
      correlationId: null,
    });

    expect(blockedReason).toContain("golden manifest hash drifted");
  });
});
