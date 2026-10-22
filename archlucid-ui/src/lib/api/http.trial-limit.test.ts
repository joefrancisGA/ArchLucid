import { afterEach, describe, expect, it, vi } from "vitest";

import { subscribeTrialLimitModal } from "@/lib/trial-limit-modal-bridge";

describe("throwApiRequestError trial limit handling", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("opens the trial limit modal on 402 with trial extensions", async () => {
    vi.stubGlobal("window", {} as Window);

    const { throwApiRequestError } = await import("./http");

    const payloads: Array<{ trialReason: string }> = [];
    const unsubscribe = subscribeTrialLimitModal((payload) => {
      payloads.push({ trialReason: payload.trialReason });
    });

    const body = JSON.stringify({
      title: "Trial limit reached",
      detail: "Trial run allowance exhausted.",
      status: 402,
      trialReason: "RunsExceeded",
      daysRemaining: 2,
    });

    const response = new Response(body, {
      status: 402,
      headers: { "content-type": "application/problem+json" },
    });

    expect(() => throwApiRequestError(response, body)).toThrow();

    expect(payloads).toHaveLength(1);
    expect(payloads[0]?.trialReason).toBe("RunsExceeded");

    unsubscribe();
  });
});
