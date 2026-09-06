import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InfrastructureAskClient } from "@/app/(operator)/governance/infrastructure/ask/InfrastructureAskClient";
import { submitInfraEvidenceAsk } from "@/lib/infra-evidence/infra-evidence-ask-api";

const mockAskResponse = {
  topicKind: "InventoryChange",
  answer: "Insufficient structured evidence is available in the current scope to answer this question.",
  insufficientEvidence: true,
  citations: [
    {
      kind: "CloudResourceId",
      id: "11111111-1111-1111-1111-111111111111",
      label: "gateway-pip",
    },
  ],
  simulatorLabel: "SIMULATOR — deterministic template grounded on cited structured rows only.",
};

let searchParams = new URLSearchParams("");

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

vi.mock("@/lib/infra-evidence/infra-evidence-ask-api", () => ({
  submitInfraEvidenceAsk: vi.fn(async () => mockAskResponse),
  formatInfraEvidenceAskApiError: (error: unknown) => String(error),
}));

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    layerGuidance: {
      layerBadge: "Advanced operations",
      headline: "Infrastructure Ask",
      useWhen: "Ask grounded questions",
      firstPilotNote: null,
    },
    contextHints: { layerHeaderEnterpriseRankCue: null },
  }),
}));

describe("InfrastructureAskClient", () => {
  it("shows insufficient evidence state, simulator banner, and citation link", async () => {
    searchParams = new URLSearchParams("");
    render(<InfrastructureAskClient />);

    fireEvent.change(screen.getByTestId("infra-ask-question"), {
      target: { value: "What changed since baseline?" },
    });
    fireEvent.click(screen.getByTestId("infra-ask-submit"));

    expect(await screen.findByTestId("infra-ask-response")).toBeInTheDocument();
    expect(screen.getByTestId("infra-ask-insufficient-evidence")).toBeInTheDocument();
    expect(screen.getByTestId("infra-ask-simulator-banner")).toBeInTheDocument();
    expect(screen.getByTestId("infra-ask-citation-CloudResourceId-11111111-1111-1111-1111-111111111111")).toBeInTheDocument();
  });

  it("links FindingId citations into the remediation factory", async () => {
    vi.mocked(submitInfraEvidenceAsk).mockResolvedValueOnce({
      topicKind: "ResourceOverview",
      answer: "One operational finding is open for this resource.",
      insufficientEvidence: false,
      citations: [
        {
          kind: "FindingId",
          id: "99999999-9999-9999-9999-999999999999",
          label: "Public endpoint",
        },
      ],
      simulatorLabel: null,
    });
    searchParams = new URLSearchParams("cloudResourceId=11111111-1111-1111-1111-111111111111");
    render(<InfrastructureAskClient />);

    fireEvent.change(screen.getByTestId("infra-ask-question"), {
      target: { value: "What findings are open?" },
    });
    fireEvent.click(screen.getByTestId("infra-ask-submit"));

    const citation = await screen.findByTestId("infra-ask-citation-FindingId-99999999-9999-9999-9999-999999999999");
    expect(citation.querySelector("a")).toHaveAttribute(
      "href",
      "/governance/infrastructure/remediation?cloudResourceId=11111111-1111-1111-1111-111111111111&findingId=99999999-9999-9999-9999-999999999999",
    );
  });

  it("shows context banner and keeps multi-turn history", async () => {
    searchParams = new URLSearchParams(
      "cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    vi.mocked(submitInfraEvidenceAsk).mockClear();

    render(<InfrastructureAskClient />);

    expect(screen.getByTestId("infra-ask-context-banner")).toHaveTextContent(
      "resource 11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByRole("link", { name: "Open resource evidence hub" })).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?snapshotId=22222222-2222-2222-2222-222222222222",
    );

    fireEvent.change(screen.getByTestId("infra-ask-question"), {
      target: { value: "First question" },
    });
    fireEvent.click(screen.getByTestId("infra-ask-submit"));
    await waitFor(() => {
      expect(vi.mocked(submitInfraEvidenceAsk)).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByTestId("infra-ask-question"), {
      target: { value: "Second question" },
    });
    fireEvent.click(screen.getByTestId("infra-ask-submit"));

    await waitFor(() => {
      expect(screen.getAllByText(/Question:/)).toHaveLength(2);
    });
    expect(vi.mocked(submitInfraEvidenceAsk)).toHaveBeenCalledTimes(2);
  });
});
