import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyJsonGetMock = vi.fn();

vi.mock("@/lib/proxy-json-client", () => ({
  proxyJsonGet: proxyJsonGetMock,
}));

describe("fetchInfraEvidenceMermaidPreview", () => {
  beforeEach(() => {
    proxyJsonGetMock.mockReset();
    proxyJsonGetMock.mockResolvedValue({ modes: [], completenessWarnings: [] });
  });

  it("forwards diagram display flags on preview requests", async () => {
    const { fetchInfraEvidenceMermaidPreview } = await import("@/lib/infra-evidence/infra-evidence-mermaid-api");
    await fetchInfraEvidenceMermaidPreview("11111111-1111-1111-1111-111111111111", {
      includeNetworkDetails: true,
      includeRecoveryServices: true,
      includeCrossGroupFanOut: true,
      includeAvdAssets: true,
      includePrivateEndpointNodes: true,
    });

    expect(proxyJsonGetMock).toHaveBeenCalledWith(
      "/api/proxy/v1/infra-evidence/snapshots/11111111-1111-1111-1111-111111111111/mermaid/preview?includePrivateEndpointNodes=true&includeNetworkDetails=true&includeRecoveryServices=true&includeCrossGroupFanOut=true&includeAvdAssets=true",
    );
  });
});

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

  it("forwards display flags on mermaid preview", async () => {
    const { fetchInfraEvidenceMermaidPreview } = await import("@/lib/infra-evidence/infra-evidence-mermaid-api");
    await fetchInfraEvidenceMermaidPreview("11111111-1111-1111-1111-111111111111", {
      includeNetworkDetails: true,
      includeCrossGroupFanOut: true,
      includeAvdAssets: true,
    });

    expect(proxyJsonGetMock).toHaveBeenCalledWith(
      "/api/proxy/v1/infra-evidence/snapshots/11111111-1111-1111-1111-111111111111/mermaid/preview?includeNetworkDetails=true&includeCrossGroupFanOut=true&includeAvdAssets=true",
    );
  });
});
