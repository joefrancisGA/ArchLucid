import { describe, expect, it } from "vitest";

import { canDeleteArchitectureDraft } from "@/lib/architecture/architecture-draft-delete-eligibility";

describe("architecture-draft-delete-eligibility", () => {
  it("allows delete when there is no linked review and server status is drafting", () => {
    expect(
      canDeleteArchitectureDraft({
        linkedReviewId: null,
        serverStatus: "Drafting",
      }),
    ).toBe(true);
  });

  it("blocks delete when a review is linked", () => {
    expect(
      canDeleteArchitectureDraft({
        linkedReviewId: "run-1",
        serverStatus: "Drafting",
      }),
    ).toBe(false);
  });

  it("blocks delete after a review has been spawned", () => {
    expect(
      canDeleteArchitectureDraft({
        linkedReviewId: null,
        serverStatus: "RunSpawned",
      }),
    ).toBe(false);
  });
});
