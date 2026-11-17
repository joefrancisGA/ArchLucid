import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceExtractionProgressCard } from "@/components/evidence/EvidenceExtractionProgressCard";
import {
  EVIDENCE_EXTRACTION_COMPLETE_HEADLINE,
  EVIDENCE_EXTRACTION_PROCESSING_HEADLINE,
} from "@/lib/evidence/evidence-extraction-progress-copy";
import { resolveEvidenceExtractionStages } from "@/lib/evidence/evidence-extraction-progress-stages";

describe("EvidenceExtractionProgressCard", () => {
  const stages = resolveEvidenceExtractionStages({
    hasBinaryDocuments: true,
    canDraftClarificationAnswers: true,
  });

  it("renders processing state with an indeterminate progress bar", () => {
    render(
      <EvidenceExtractionProgressCard
        phase="processing"
        documentNames={["ARCHITECTURE_HANDBOOK_2026-06-06.docx"]}
        stages={stages}
        activeStageIndex={1}
        completion={null}
      />,
    );

    expect(screen.getByText(EVIDENCE_EXTRACTION_PROCESSING_HEADLINE)).toBeInTheDocument();
    expect(screen.getByText(/ARCHITECTURE_HANDBOOK_2026-06-06\.docx/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByTestId("evidence-extraction-progress-card")).toHaveAttribute("aria-busy", "true");
  });

  it("renders completion summary without a progress bar", () => {
    render(
      <EvidenceExtractionProgressCard
        phase="complete"
        documentNames={["ARCHITECTURE_HANDBOOK_2026-06-06.docx"]}
        stages={stages}
        activeStageIndex={stages.length - 1}
        completion={{ extractedCharacterCount: 6228, suggestedAnswerCount: 3 }}
      />,
    );

    expect(screen.getByText(EVIDENCE_EXTRACTION_COMPLETE_HEADLINE)).toBeInTheDocument();
    expect(screen.getByTestId("evidence-extraction-completion-summary")).toHaveTextContent(
      /6,228 characters extracted/,
    );
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
