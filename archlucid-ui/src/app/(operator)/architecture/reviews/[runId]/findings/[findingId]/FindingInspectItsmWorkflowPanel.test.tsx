import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FINDING_ITSM_HUMAN_REVIEW_STATUS_CAPTION } from "@/lib/findings/finding-human-review-display";
import { FindingInspectItsmWorkflowPanel } from "./FindingInspectItsmWorkflowPanel";

vi.mock("@/lib/use-itsm-native-create-enabled", () => ({
  useItsmNativeCreateEnabled: () => true,
}));

vi.mock("@/components/ItsmOutboundQuickActions", () => ({
  ItsmOutboundQuickActions: () => <div data-testid="itsm-quick-actions" />,
}));

vi.mock("@/components/FindingCorrelationVocabularyDisambiguation", () => ({
  FindingCorrelationVocabularyDisambiguation: () => <div data-testid="correlation-vocabulary" />,
}));

describe("FindingInspectItsmWorkflowPanel", () => {
  it("labels inbound human review as ITSM queue state separate from disposition trail (TB-987)", () => {
    render(
      <FindingInspectItsmWorkflowPanel
        findingId="phi-minimization-risk"
        humanReviewStatusLabel="Human review approved"
      />,
    );

    expect(screen.getByText(/Inbound sync human review:/i)).toBeInTheDocument();
    expect(screen.getByText("Human review approved")).toBeInTheDocument();
    expect(screen.getByText(FINDING_ITSM_HUMAN_REVIEW_STATUS_CAPTION)).toBeInTheDocument();
  });
});
