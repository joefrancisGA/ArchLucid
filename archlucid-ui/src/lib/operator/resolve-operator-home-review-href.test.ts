import { describe, expect, it, vi } from "vitest";

import { resolveOperatorHomeReviewHref } from "@/lib/operator/resolve-operator-home-review-href";

vi.mock("@/lib/governance-scoped-review-open-href", () => ({
  resolveGovernanceScopedReviewOpenHref: (input: { runId: string; requestId?: string | null }) =>
    `/mock-scoped/${input.runId}${input.requestId ? `?request=${input.requestId}` : ""}`,
}));

describe("resolveOperatorHomeReviewHref", () => {
  it("forwards run id and optional request id to governance scoped resolver", () => {
    expect(
      resolveOperatorHomeReviewHref({
        runId: "run-9",
        requestId: "req-1",
      }),
    ).toBe("/mock-scoped/run-9?request=req-1");
  });
});
