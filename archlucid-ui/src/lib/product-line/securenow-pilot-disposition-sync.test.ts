import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchDisposition = vi.fn();
const saveDisposition = vi.fn();

vi.mock("@/lib/product-line/securenow-pilot-disposition-api", () => ({
  fetchSecureNowPilotPathDisposition: (...args: unknown[]) => fetchDisposition(...args),
  saveSecureNowPilotPathDisposition: (...args: unknown[]) => saveDisposition(...args),
}));

import {
  loadSecureNowPilotDispositionForPath,
  persistSecureNowPilotDispositionForPath,
} from "./securenow-pilot-disposition-sync";
import { writeSecureNowPilotDisposition } from "./securenow-pilot-disposition-storage";

describe("securenow pilot disposition sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("hydrates browser cache from tenant audit on load", async () => {
    fetchDisposition.mockResolvedValueOnce({
      pathId: "path-1",
      outcome: "Stop",
      rationale: "Pilot stop.",
      recordedUtc: "2026-01-01T00:00:00Z",
    });

    const loaded = await loadSecureNowPilotDispositionForPath("path-1");

    expect(loaded).toEqual({ outcome: "Stop", rationale: "Pilot stop." });
    expect(fetchDisposition).toHaveBeenCalledWith("path-1");
  });

  it("persists to tenant audit before updating browser cache", async () => {
    saveDisposition.mockResolvedValueOnce({
      succeeded: true,
      errorMessage: null,
      disposition: {
        pathId: "path-2",
        outcome: "Extend",
        rationale: "More time.",
        recordedUtc: "2026-01-01T00:00:00Z",
      },
    });

    writeSecureNowPilotDisposition("path-2", { outcome: "Proceed", rationale: "Old copy." });

    const result = await persistSecureNowPilotDispositionForPath("path-2", {
      outcome: "Extend",
      rationale: "More time.",
    });

    expect(result).toEqual({ status: "saved", tenantAuditRecorded: true });
    expect(saveDisposition).toHaveBeenCalledWith("path-2", { outcome: "Extend", rationale: "More time." });
  });

  it("returns an error outcome when tenant audit save fails", async () => {
    saveDisposition.mockResolvedValueOnce({
      succeeded: false,
      errorMessage: "Audit write rejected.",
      disposition: null,
    });

    const result = await persistSecureNowPilotDispositionForPath("path-3", {
      outcome: "Stop",
      rationale: "Pilot stop.",
    });

    expect(result).toEqual({ status: "error", errorMessage: "Audit write rejected." });
  });
});
