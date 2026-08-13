import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  getFindingInspect: vi.fn(),
}));

import { getFindingInspect } from "@/lib/api";
import { ApiRequestError } from "@/lib/api-request-error";
import { loadFindingInspectForRoute } from "@/lib/load-finding-inspect-for-route";
import { SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID, SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_TITLE, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { showcasePrimaryFindingDetailHref } from "@/lib/showcase-sample-review-registry";

describe("loadFindingInspectForRoute — showcase primary finding", () => {
  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
    delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;
  });

  it("falls back to curated primary finding payload in buyer-polished shell when inspect API 404s", async () => {
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
    delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;

    vi.mocked(getFindingInspect).mockRejectedValue(
      new ApiRequestError("not found", {
        problem: null,
        correlationId: null,
        httpStatus: 404,
      }),
    );

    const result = await loadFindingInspectForRoute(
      SHOWCASE_STATIC_DEMO_RUN_ID,
      SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
    );

    expect(result.failure).toBeNull();
    expect(result.invalidRouteAlignment).toBe(false);
    expect(result.payload?.findingId).toBe(SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID);
    expect(result.payload?.typedPayload.title).toBe(SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_TITLE);
    expect(showcasePrimaryFindingDetailHref()).toBe(
      `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}/findings/${SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID}`,
    );
  });
});
