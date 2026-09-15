import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyJsonGetMock = vi.fn();

vi.mock("@/lib/proxy-json-client", () => ({
  proxyJsonGet: proxyJsonGetMock,
}));

describe("fetchInfraEvidenceMermaidRender", () => {
  beforeEach(() => {
    proxyJsonGetMock.mockReset();
    proxyJsonGetMock.mockResolvedValue({
      status: "Succeeded",
      mermaid: "flowchart LR",
      metrics: null,
      fallbackArtifacts: [],
      collapseReport: null,
    });
  });

  it("includes hideTiers when Executive tiers are hidden", async () => {
    const { fetchInfraEvidenceMermaidRender } = await import("@/lib/infra-evidence/infra-evidence-mermaid-api");
    await fetchInfraEvidenceMermaidRender("11111111-1111-1111-1111-111111111111", {
      mode: "executive",
      hiddenExecutiveTierKeys: ["storage", "workloads"],
    });

    expect(proxyJsonGetMock).toHaveBeenCalledWith(
      "/api/proxy/v1/infra-evidence/snapshots/11111111-1111-1111-1111-111111111111/mermaid?mode=executive&hideTiers=storage%2Cworkloads",
    );
  });
});
