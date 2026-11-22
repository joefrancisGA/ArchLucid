import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchInfrastructureDiagramDocumentationDecision,
  saveInfrastructureDiagramDocumentationDecision,
  saveInfrastructureDiagramNodeMapping,
} from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-api";
import { fetchRemediationInstanceDetail } from "@/lib/infra-evidence/infra-evidence-remediation-api";
import { proxyJsonGet, proxyJsonPut } from "@/lib/proxy-json-client";

vi.mock("@/lib/proxy-json-client", () => ({
  proxyJsonGet: vi.fn(),
  proxyJsonPost: vi.fn(),
  proxyJsonPut: vi.fn(),
}));

describe("infra-evidence required route segments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects blank comparison ids before advisory diagram requests", async () => {
    await expect(saveInfrastructureDiagramNodeMapping("  ", {} as never)).rejects.toThrow(
      "comparisonId is required.",
    );
    await expect(saveInfrastructureDiagramDocumentationDecision("  ", {} as never)).rejects.toThrow(
      "comparisonId is required.",
    );
    await expect(
      fetchInfrastructureDiagramDocumentationDecision("  ", "DiagramNode", "subject-1"),
    ).rejects.toThrow("comparisonId is required.");

    expect(proxyJsonPut).not.toHaveBeenCalled();
    expect(proxyJsonGet).not.toHaveBeenCalled();
  });

  it("trims and encodes required comparison and remediation instance ids", async () => {
    vi.mocked(proxyJsonPut).mockResolvedValueOnce({} as never);
    vi.mocked(proxyJsonGet)
      .mockResolvedValueOnce({} as never)
      .mockResolvedValueOnce({
        instance: { instanceId: "instance/1", status: "Classified" },
      });

    await saveInfrastructureDiagramNodeMapping(" comparison/1 ", {} as never);
    await fetchInfrastructureDiagramDocumentationDecision(" comparison/1 ", "DiagramNode", "subject-1");
    await fetchRemediationInstanceDetail(" instance/1 ");

    expect(proxyJsonPut).toHaveBeenCalledWith(
      "/api/proxy/v1/infrastructure/diagram-comparisons/comparison%2F1/node-mappings",
      {},
    );
    expect(proxyJsonGet).toHaveBeenNthCalledWith(
      1,
      "/api/proxy/v1/infrastructure/diagram-comparisons/comparison%2F1/documentation-decisions?subjectKind=DiagramNode&subjectKey=subject-1",
    );
    expect(proxyJsonGet).toHaveBeenNthCalledWith(
      2,
      "/api/proxy/v1/infra-evidence/remediation-instances/instance%2F1",
    );
  });

  it("rejects a blank remediation instance id before fetching detail", async () => {
    await expect(fetchRemediationInstanceDetail("  ")).rejects.toThrow("instanceId is required.");
    expect(proxyJsonGet).not.toHaveBeenCalled();
  });
});
