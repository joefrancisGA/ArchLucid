import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AskArchitectureIntelligenceVocabularyRail } from "@/components/AskArchitectureIntelligenceVocabularyRail";
import {
  ASK_ARCHITECTURE_INTELLIGENCE_ASK_LINK,
  ASK_ARCHITECTURE_INTELLIGENCE_COMPACT_LINE,
  ASK_ARCHITECTURE_INTELLIGENCE_HEADING,
  ASK_ARCHITECTURE_INTELLIGENCE_INTELLIGENCE_LINK,
  ASK_ARCHITECTURE_INTELLIGENCE_WHY_TWO,
} from "@/lib/vocabulary/ask-architecture-intelligence-vocabulary";

describe("AskArchitectureIntelligenceVocabularyRail (TB-2313)", () => {
  it("renders ask-review-questions strip with peer link to architecture intelligence", () => {
    render(
      <AskArchitectureIntelligenceVocabularyRail currentSurfaceId="ask-review-questions" />,
    );

    const strip = screen.getByTestId("ask-architecture-intelligence-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "ask-review-questions");
    expect(strip.textContent ?? "").toContain(ASK_ARCHITECTURE_INTELLIGENCE_COMPACT_LINE);

    const peer = screen.getByTestId("ask-architecture-intelligence-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ASK_ARCHITECTURE_INTELLIGENCE_INTELLIGENCE_LINK.label);
    expect(peer).toHaveAttribute("href", ASK_ARCHITECTURE_INTELLIGENCE_INTELLIGENCE_LINK.href);
  });

  it("renders architecture-intelligence strip with peer link to ask review questions", () => {
    render(
      <AskArchitectureIntelligenceVocabularyRail currentSurfaceId="architecture-intelligence" />,
    );

    const peer = screen.getByTestId("ask-architecture-intelligence-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ASK_ARCHITECTURE_INTELLIGENCE_ASK_LINK.label);
    expect(peer).toHaveAttribute("href", ASK_ARCHITECTURE_INTELLIGENCE_ASK_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <AskArchitectureIntelligenceVocabularyRail
        currentSurfaceId="ask-review-questions"
        variant="full"
      />,
    );

    expect(screen.getByText(ASK_ARCHITECTURE_INTELLIGENCE_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ASK_ARCHITECTURE_INTELLIGENCE_WHY_TWO)).toBeInTheDocument();
  });
});
