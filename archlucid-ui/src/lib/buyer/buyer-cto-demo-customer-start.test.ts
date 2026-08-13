import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/buyer/buyer-cto-demo-readiness", () => ({
  evaluateBuyerCtoDemoReadiness: vi.fn(),
}));

import {
  evaluateBuyerCtoDemoCustomerStart,
  resolveBuyerCtoDemoCustomerStartOutcome,
} from "@/lib/buyer/buyer-cto-demo-customer-start";
import {
  BUYER_CTO_DEMO_ENVIRONMENT_UNAVAILABLE_MESSAGE,
  BUYER_CTO_DEMO_SAMPLE_MODE_NOTICE,
  BUYER_CTO_DEMO_START_FAILED_MESSAGE,
} from "@/lib/buyer/buyer-polish-copy";
import { evaluateBuyerCtoDemoReadiness } from "@/lib/buyer/buyer-cto-demo-readiness";

const mockEvaluate = vi.mocked(evaluateBuyerCtoDemoReadiness);

describe("resolveBuyerCtoDemoCustomerStartOutcome", () => {
  it("maps not-ready to a customer-safe unavailable message", () => {
    expect(resolveBuyerCtoDemoCustomerStartOutcome("not-ready")).toEqual({
      status: "failed",
      message: BUYER_CTO_DEMO_ENVIRONMENT_UNAVAILABLE_MESSAGE,
    });
  });

  it("maps static fallback to a labeled sample notice", () => {
    expect(resolveBuyerCtoDemoCustomerStartOutcome("ready-with-static-fallback")).toEqual({
      status: "ready-sample",
      notice: BUYER_CTO_DEMO_SAMPLE_MODE_NOTICE,
    });
  });

  it("maps ready to success without internal details", () => {
    expect(resolveBuyerCtoDemoCustomerStartOutcome("ready")).toEqual({ status: "ready" });
  });
});

describe("evaluateBuyerCtoDemoCustomerStart", () => {
  it("returns a generic failure message when readiness throws", async () => {
    mockEvaluate.mockRejectedValueOnce(new Error("api down"));

    await expect(evaluateBuyerCtoDemoCustomerStart()).resolves.toEqual({
      status: "failed",
      message: BUYER_CTO_DEMO_START_FAILED_MESSAGE,
    });
  });
});
