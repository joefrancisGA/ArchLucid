import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureIntelligenceRefineNextSteps } from "@/components/architecture-intelligence/ArchitectureIntelligenceRefineNextSteps";
import {
  ARCHITECTURE_INTELLIGENCE_REFINE_OPEN_LINKED_REVIEW_LABEL,
  ARCHITECTURE_INTELLIGENCE_REFINE_START_REVIEW_LABEL,
} from "@/lib/architecture/architecture-intelligence-refine-next-steps-copy";

describe("ArchitectureIntelligenceRefineNextSteps", () => {
  it("offers start review when findings are not on a linked review yet", () => {
    render(
      <ArchitectureIntelligenceRefineNextSteps
        testIdPrefix="architecture-draft-ai-refine"
        result={{ runId: "ai-run-1", integrityPassedFindingIds: ["f1"] }}
        canPublish={false}
      />,
    );

    expect(screen.getByTestId("architecture-draft-ai-refine-next-steps")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-ai-refine-start-review")).toHaveTextContent(
      ARCHITECTURE_INTELLIGENCE_REFINE_START_REVIEW_LABEL,
    );
  });

  it("opens the linked review when publish path is active", () => {
    render(
      <ArchitectureIntelligenceRefineNextSteps
        testIdPrefix="run-detail-ai-refine"
        result={{ runId: "run-001", publishedToProduct: true, integrityPassedFindingIds: ["f1"] }}
        canPublish
        linkedReviewId="run-001"
      />,
    );

    expect(screen.getByTestId("run-detail-ai-refine-open-linked-review")).toHaveTextContent(
      ARCHITECTURE_INTELLIGENCE_REFINE_OPEN_LINKED_REVIEW_LABEL,
    );
  });
});
