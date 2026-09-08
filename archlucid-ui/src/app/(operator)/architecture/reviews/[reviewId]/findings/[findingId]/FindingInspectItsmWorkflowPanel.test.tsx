import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FINDING_ITSM_HUMAN_REVIEW_STATUS_CAPTION } from "@/lib/findings/finding-human-review-display";
import { FINDING_HUMAN_REVIEW_DISPOSITION_DIVERGENCE_BANNER } from "@/lib/findings/finding-human-review-disposition-divergence";
import { FindingInspectItsmWorkflowPanel } from "./FindingInspectItsmWorkflowPanel";

vi.mock("@/lib/use-itsm-native-create-enabled", () => ({
  useItsmNativeCreateEnabled: () => true,
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionDeskChrome: () => true,
}));

vi.mock("@/components/itsm/ItsmOutboundQuickActions", () => ({
  ItsmOutboundQuickActions: () => <div data-testid="itsm-quick-actions" />,
}));

vi.mock("@/components/findings/FindingCorrelationVocabularyDisambiguation", () => ({
  FindingCorrelationVocabularyDisambiguation: () => <div data-testid="correlation-vocabulary" />,
}));

describe("FindingInspectItsmWorkflowPanel", () => {
  it("labels inbound human review as ITSM queue state separate from disposition trail (TB-987)", () => {
    render(
      <FindingInspectItsmWorkflowPanel
        findingId="sensitive-data-minimization-risk"
        humanReviewStatusLabel="Human review approved"
      />,
    );

    expect(screen.getByText(/Inbound sync human review:/i)).toBeInTheDocument();
    expect(screen.getByText("Human review approved")).toBeInTheDocument();
    expect(screen.getByText(FINDING_ITSM_HUMAN_REVIEW_STATUS_CAPTION)).toBeInTheDocument();
  });

  it("shows divergence banner on Working desk when ITSM queue state disagrees with disposition trail (LP-17)", () => {
    render(
      <FindingInspectItsmWorkflowPanel
        findingId="sensitive-data-minimization-risk"
        humanReviewStatusLabel="Human review approved"
        humanReviewDispositionDivergence={{
          isDiverged: true,
          reason: "ITSM queue state (approved) does not match current disposition (Deferred).",
        }}
      />,
    );

    expect(screen.getByTestId("finding-itsm-disposition-divergence-banner")).toBeInTheDocument();
    expect(screen.getByText(FINDING_HUMAN_REVIEW_DISPOSITION_DIVERGENCE_BANNER)).toBeInTheDocument();
    expect(screen.getByText(/does not match current disposition/i)).toBeInTheDocument();
  });
});
