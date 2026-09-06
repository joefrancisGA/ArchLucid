import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InfrastructureAskClient } from "@/app/(operator)/governance/infrastructure/ask/InfrastructureAskClient";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-ask-api", () => ({
  submitInfraEvidenceAsk: vi.fn(async () => ({
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
  })),
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
});
