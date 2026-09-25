import { describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";
import { apiGet } from "@/lib/api/http";
import { CUSTOMER_INTAKE_SAMPLE_RUN_ID } from "@/lib/samples/customer-intake-modernization/definition";

import { fetchRunDetailCriticalPageBundle } from "./fetch-run-detail-page-bundle-client";

vi.mock("@/lib/api/http", () => ({
  apiGet: vi.fn(),
}));

describe("fetch-run-detail-page-bundle-client showcase spine", () => {
  it("does not call the network for customer-intake-modernization", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const bundle = await fetchRunDetailCriticalPageBundle(CUSTOMER_INTAKE_SAMPLE_RUN_ID);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(bundle.data.buyerSummary.run.runId).toBe(CUSTOMER_INTAKE_SAMPLE_RUN_ID);
    expect(bundle.data.manifestSummary).not.toBeNull();
    expect(bundle.data.artifacts.length).toBeGreaterThan(0);

    vi.unstubAllGlobals();
  });

  it("preserves not-found errors so the branded recovery boundary can render", async () => {
    const notFound = new ApiRequestError("Review not found.", {
      problem: { title: "Not found", status: 404 },
      correlationId: "test-correlation-id",
      httpStatus: 404,
    });
    vi.mocked(apiGet).mockRejectedValueOnce(notFound);

    await expect(fetchRunDetailCriticalPageBundle("missing-review-id")).rejects.toBe(notFound);
  });
});
