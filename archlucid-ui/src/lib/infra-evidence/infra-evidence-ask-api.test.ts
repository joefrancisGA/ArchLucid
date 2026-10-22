import { describe, expect, it, vi } from "vitest";

import { submitInfraEvidenceAsk } from "./infra-evidence-ask-api";
import { proxyJsonPost } from "@/lib/proxy-json-client";

vi.mock("@/lib/proxy-json-client", () => ({
  proxyJsonPost: vi.fn(),
}));

describe("submitInfraEvidenceAsk", () => {
  it("preserves stored empty Ask values and carries omitted values as null", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      topicKind: "ResourceOverview",
      answer: "",
      insufficientEvidence: false,
      citations: [],
      viewPlan: { mermaidMode: "network", honestyLabel: "" },
    });

    const stored = await submitInfraEvidenceAsk({ question: "What changed?" });

    expect(stored.answer).toBe("");
    expect(stored.citations).toEqual([]);
    expect(stored.viewPlan?.honestyLabel).toBe("");

    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      topicKind: "ResourceOverview",
      insufficientEvidence: false,
      answer: null,
      citations: null,
      viewPlan: { mermaidMode: null, honestyLabel: null },
    });

    const omitted = await submitInfraEvidenceAsk({ question: "What changed?" });

    expect(omitted.answer).toBeNull();
    expect(omitted.citations).toBeNull();
    expect(omitted.viewPlan?.honestyLabel).toBeNull();
    expect(omitted.viewPlan?.mermaidMode).toBeNull();
  });

  it("keeps citations with omitted kind and id", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      topicKind: "ResourceOverview",
      answer: "Answer",
      insufficientEvidence: false,
      citations: [{ kind: null, id: null, label: null }],
      viewPlan: null,
    });

    const response = await submitInfraEvidenceAsk({ question: "What changed?" });

    expect(response.citations).toEqual([{ kind: null, id: null, label: null }]);
  });
});
