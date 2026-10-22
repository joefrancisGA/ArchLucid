import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  recordFirstSessionPurposeChosen,
  recordLiveSeatScopeLandingOnce,
} from "@/lib/live-seat-funnel-telemetry";

describe("live-seat-funnel-telemetry (LS-017)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    window.sessionStorage.clear();
    fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("emits first_session_purpose_live vs training", () => {
    recordFirstSessionPurposeChosen("live");
    recordFirstSessionPurposeChosen("training");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/proxy/v1/diagnostics/first-tenant-funnel",
      expect.objectContaining({ body: JSON.stringify({ event: "first_session_purpose_live" }) }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/proxy/v1/diagnostics/first-tenant-funnel",
      expect.objectContaining({ body: JSON.stringify({ event: "first_session_purpose_training" }) }),
    );
  });

  it("emits dedicated vs sample scope landing at most once per session", () => {
    recordLiveSeatScopeLandingOnce(false);
    recordLiveSeatScopeLandingOnce(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/proxy/v1/diagnostics/first-tenant-funnel",
      expect.objectContaining({ body: JSON.stringify({ event: "post_auth_landed_dedicated_scope" }) }),
    );
  });
});
