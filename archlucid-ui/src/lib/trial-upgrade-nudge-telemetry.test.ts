import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  recordTrialUpgradeNudgeClicked,
  recordTrialUpgradeNudgeShown,
} from "./trial-upgrade-nudge-telemetry";

describe("trial-upgrade-nudge-telemetry", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts shown telemetry with trigger context", () => {
    recordTrialUpgradeNudgeShown("runs");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/proxy/v1/diagnostics/trial-upgrade-nudge/shown",
      expect.objectContaining({
        method: "POST",
        keepalive: true,
        body: JSON.stringify({ trigger: "runs" }),
      }),
    );
  });

  it("posts clicked telemetry with trigger context", () => {
    recordTrialUpgradeNudgeClicked("seats");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/proxy/v1/diagnostics/trial-upgrade-nudge/clicked",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ trigger: "seats" }),
      }),
    );
  });

  it("posts every supported trigger for shown and clicked", () => {
    const triggers = ["runs", "seats", "expiry"] as const;

    for (const trigger of triggers) {
      recordTrialUpgradeNudgeShown(trigger);
      recordTrialUpgradeNudgeClicked(trigger);
    }

    expect(fetchMock).toHaveBeenCalledTimes(triggers.length * 2);

    for (const trigger of triggers) {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/proxy/v1/diagnostics/trial-upgrade-nudge/shown",
        expect.objectContaining({ body: JSON.stringify({ trigger }) }),
      );
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/proxy/v1/diagnostics/trial-upgrade-nudge/clicked",
        expect.objectContaining({ body: JSON.stringify({ trigger }) }),
      );
    }
  });

  it("does not throw when fetch rejects", () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));

    expect(() => {
      recordTrialUpgradeNudgeClicked("expiry");
    }).not.toThrow();
  });
});
