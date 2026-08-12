import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingsQueueSearchEvidenceVocabularyRail } from "@/components/findings/FindingsQueueSearchEvidenceVocabularyRail";
import {
  FINDINGS_QUEUE_SEARCH_EVIDENCE_COMPACT_LINE,
  FINDINGS_QUEUE_SEARCH_EVIDENCE_FINDINGS_LINK,
  FINDINGS_QUEUE_SEARCH_EVIDENCE_HEADING,
  FINDINGS_QUEUE_SEARCH_EVIDENCE_SEARCH_LINK,
  FINDINGS_QUEUE_SEARCH_EVIDENCE_WHY_TWO,
} from "@/lib/vocabulary/findings-queue-search-evidence-vocabulary";

describe("FindingsQueueSearchEvidenceVocabularyRail (TB-2261)", () => {
  it("renders findings strip with peer link to Search review evidence", () => {
    render(
      <FindingsQueueSearchEvidenceVocabularyRail currentSurfaceId="findings-queue" />,
    );

    const strip = screen.getByTestId("findings-queue-search-evidence-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "findings-queue");
    expect(strip.textContent ?? "").toContain(FINDINGS_QUEUE_SEARCH_EVIDENCE_COMPACT_LINE);

    const peer = screen.getByTestId("findings-queue-search-evidence-vocabulary-peer-link");
    expect(peer).toHaveTextContent(FINDINGS_QUEUE_SEARCH_EVIDENCE_SEARCH_LINK.label);
    expect(peer).toHaveAttribute("href", FINDINGS_QUEUE_SEARCH_EVIDENCE_SEARCH_LINK.href);
  });

  it("renders search strip with peer link to findings queue", () => {
    render(
      <FindingsQueueSearchEvidenceVocabularyRail currentSurfaceId="search-evidence" />,
    );

    expect(screen.getByTestId("findings-queue-search-evidence-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "search-evidence",
    );

    const peer = screen.getByTestId("findings-queue-search-evidence-vocabulary-peer-link");
    expect(peer).toHaveTextContent(FINDINGS_QUEUE_SEARCH_EVIDENCE_FINDINGS_LINK.label);
    expect(peer).toHaveAttribute("href", FINDINGS_QUEUE_SEARCH_EVIDENCE_FINDINGS_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <FindingsQueueSearchEvidenceVocabularyRail
        currentSurfaceId="findings-queue"
        variant="full"
      />,
    );

    const strip = screen.getByTestId("findings-queue-search-evidence-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(FINDINGS_QUEUE_SEARCH_EVIDENCE_HEADING)).toBeInTheDocument();
    expect(screen.getByText(FINDINGS_QUEUE_SEARCH_EVIDENCE_WHY_TWO)).toBeInTheDocument();
    expect(
      screen.getByTestId("findings-queue-search-evidence-vocabulary-current"),
    ).toHaveTextContent(FINDINGS_QUEUE_SEARCH_EVIDENCE_FINDINGS_LINK.label);
  });
});
