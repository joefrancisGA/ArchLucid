import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AskSearchEvidenceVocabularyRail } from "@/components/AskSearchEvidenceVocabularyRail";
import {
  ASK_SEARCH_EVIDENCE_ASK_LINK,
  ASK_SEARCH_EVIDENCE_COMPACT_LINE,
  ASK_SEARCH_EVIDENCE_HEADING,
  ASK_SEARCH_EVIDENCE_SEARCH_LINK,
  ASK_SEARCH_EVIDENCE_WHY_TWO,
} from "@/lib/vocabulary/ask-search-evidence-vocabulary";

describe("AskSearchEvidenceVocabularyRail (TB-2231)", () => {
  it("renders compact strip on Ask with peer link to Search", () => {
    render(<AskSearchEvidenceVocabularyRail currentSurfaceId="ask" />);

    const strip = screen.getByTestId("ask-search-evidence-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "ask");
    expect(strip.textContent ?? "").toContain(ASK_SEARCH_EVIDENCE_COMPACT_LINE);

    const peer = screen.getByTestId("ask-search-evidence-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ASK_SEARCH_EVIDENCE_SEARCH_LINK.label);
    expect(peer).toHaveAttribute("href", ASK_SEARCH_EVIDENCE_SEARCH_LINK.href);
  });

  it("renders compact strip on Search with peer link to Ask", () => {
    render(<AskSearchEvidenceVocabularyRail currentSurfaceId="search" />);

    expect(screen.getByTestId("ask-search-evidence-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "search",
    );

    const peer = screen.getByTestId("ask-search-evidence-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ASK_SEARCH_EVIDENCE_ASK_LINK.label);
    expect(peer).toHaveAttribute("href", ASK_SEARCH_EVIDENCE_ASK_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <AskSearchEvidenceVocabularyRail currentSurfaceId="ask" variant="full" />,
    );

    const strip = screen.getByTestId("ask-search-evidence-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(ASK_SEARCH_EVIDENCE_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ASK_SEARCH_EVIDENCE_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("ask-search-evidence-vocabulary-current")).toHaveTextContent(
      ASK_SEARCH_EVIDENCE_ASK_LINK.label,
    );
  });
});
