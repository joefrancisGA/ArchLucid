import { describe, expect, it, vi } from "vitest";

import { fetchRemediationInstances } from "@/lib/infra-evidence/infra-evidence-remediation-api";
import { proxyJsonGet } from "@/lib/proxy-json-client";

vi.mock("@/lib/proxy-json-client", () => ({
  proxyJsonGet: vi.fn(),
}));

describe("infra-evidence-remediation-api", () => {
  it("fetchRemediationInstances appends cloudResourceId when scoped", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([]);

    await fetchRemediationInstances({ cloudResourceId: "11111111-1111-1111-1111-111111111111" });

    expect(proxyJsonGet).toHaveBeenCalledWith(
      "/api/proxy/v1/infra-evidence/remediation-instances?cloudResourceId=11111111-1111-1111-1111-111111111111",
    );
  });

  it("fetchRemediationInstances appends findingId when scoped", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([]);

    await fetchRemediationInstances({ findingId: "22222222-2222-2222-2222-222222222222" });

    expect(proxyJsonGet).toHaveBeenCalledWith(
      "/api/proxy/v1/infra-evidence/remediation-instances?findingId=22222222-2222-2222-2222-222222222222",
    );
  });

  it("fetchRemediationInstances appends both cloudResourceId and findingId when scoped", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([]);

    await fetchRemediationInstances({
      cloudResourceId: "11111111-1111-1111-1111-111111111111",
      findingId: "22222222-2222-2222-2222-222222222222",
    });

    expect(proxyJsonGet).toHaveBeenCalledWith(
      "/api/proxy/v1/infra-evidence/remediation-instances?cloudResourceId=11111111-1111-1111-1111-111111111111&findingId=22222222-2222-2222-2222-222222222222",
    );
  });
});
