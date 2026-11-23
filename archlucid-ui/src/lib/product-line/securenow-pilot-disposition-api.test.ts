import { describe, expect, it, vi } from "vitest";

import { proxyJsonGet, proxyJsonPut } from "@/lib/proxy-json-client";
import {
  fetchSecureNowPilotPathDisposition,
  saveSecureNowPilotPathDisposition,
} from "./securenow-pilot-disposition-api";

vi.mock("@/lib/proxy-json-client", () => ({
  proxyJsonGet: vi.fn(),
  proxyJsonPut: vi.fn(),
}));

describe("securenow pilot disposition api", () => {
  it("encodes a slash in the path id before the disposition request", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce({
      pathId: "a/b",
      outcome: "Stop",
      rationale: "Stop.",
      recordedUtc: "2026-01-01T00:00:00Z",
    });
    vi.mocked(proxyJsonPut).mockResolvedValueOnce({
      succeeded: true,
      disposition: {
        pathId: "a/b",
        outcome: "Stop",
        rationale: "Stop.",
        recordedUtc: "2026-01-01T00:00:00Z",
      },
    });

    await fetchSecureNowPilotPathDisposition("a/b");
    await saveSecureNowPilotPathDisposition("a/b", { outcome: "Stop", rationale: "Stop." });

    const encoded = "/api/proxy/v1/operational-security/paths/a%2Fb/pilot-disposition";

    expect(vi.mocked(proxyJsonGet)).toHaveBeenCalledWith(encoded);
    expect(vi.mocked(proxyJsonPut)).toHaveBeenCalledWith(encoded, { outcome: "Stop", rationale: "Stop." });
  });
});