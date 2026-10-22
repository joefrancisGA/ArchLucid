import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("core-pilot-rail-telemetry", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("posts checklist steps within the API contract (0–3)", async () => {
    const { recordCorePilotRailChecklistStep } = await import("@/lib/core-pilot-rail-telemetry");

    recordCorePilotRailChecklistStep(3);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.stepIndex).toBe(3);
  });

  it("does not POST step indices above the API maximum (3)", async () => {
    const { recordCorePilotRailChecklistStep } = await import("@/lib/core-pilot-rail-telemetry");

    recordCorePilotRailChecklistStep(4);
    recordCorePilotRailChecklistStep(5);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
