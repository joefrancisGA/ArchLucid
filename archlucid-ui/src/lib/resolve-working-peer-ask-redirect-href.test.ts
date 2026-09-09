import { describe, expect, it } from "vitest";

import { resolveWorkingPeerAskRedirectHref } from "@/lib/resolve-working-peer-ask-redirect-href";

describe("resolveWorkingPeerAskRedirectHref (SY-37 / ADR 0079)", () => {
  it("redirects bare peer Ask to nested Ask when last-open architecture exists", () => {
    expect(
      resolveWorkingPeerAskRedirectHref({
        pathname: "/insights/ask-review-questions",
        lastOpenArchitectureId: "architecture-identity-001",
        search: "?runId=run-1",
      }),
    ).toBe("/architecture/architectures/architecture-identity-001/ask?runId=run-1");
  });

  it("sends unscoped Working to portfolio when no architecture is known", () => {
    expect(
      resolveWorkingPeerAskRedirectHref({
        pathname: "/insights/ask-review-questions",
      }),
    ).toBe("/architecture/architectures");
  });

  it("does not redirect non-Ask paths", () => {
    expect(
      resolveWorkingPeerAskRedirectHref({
        pathname: "/insights/compare-two-reviews",
        lastOpenArchitectureId: "architecture-identity-001",
      }),
    ).toBeNull();
  });
});
