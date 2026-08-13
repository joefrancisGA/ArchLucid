import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RagHealthSystemHealthVocabularyRail } from "@/components/RagHealthSystemHealthVocabularyRail";
import {
  RAG_HEALTH_SYSTEM_HEALTH_COMPACT_LINE,
  RAG_HEALTH_SYSTEM_HEALTH_HEADING,
  RAG_HEALTH_SYSTEM_HEALTH_RAG_LINK,
  RAG_HEALTH_SYSTEM_HEALTH_SYSTEM_LINK,
  RAG_HEALTH_SYSTEM_HEALTH_WHY_TWO,
} from "@/lib/vocabulary/rag-health-system-health-vocabulary";

describe("RagHealthSystemHealthVocabularyRail (TB-2285)", () => {
  it("renders compact strip on RAG health with peer link to system health", () => {
    render(<RagHealthSystemHealthVocabularyRail currentSurfaceId="rag-health" />);

    const strip = screen.getByTestId("rag-health-system-health-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "rag-health");
    expect(strip.textContent ?? "").toContain(RAG_HEALTH_SYSTEM_HEALTH_COMPACT_LINE);

    const peer = screen.getByTestId("rag-health-system-health-vocabulary-peer-link");
    expect(peer).toHaveTextContent(RAG_HEALTH_SYSTEM_HEALTH_SYSTEM_LINK.label);
    expect(peer).toHaveAttribute("href", RAG_HEALTH_SYSTEM_HEALTH_SYSTEM_LINK.href);
  });

  it("renders compact strip on system health with peer link to RAG health", () => {
    render(<RagHealthSystemHealthVocabularyRail currentSurfaceId="system-health" />);

    expect(screen.getByTestId("rag-health-system-health-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "system-health",
    );

    const peer = screen.getByTestId("rag-health-system-health-vocabulary-peer-link");
    expect(peer).toHaveTextContent(RAG_HEALTH_SYSTEM_HEALTH_RAG_LINK.label);
    expect(peer).toHaveAttribute("href", RAG_HEALTH_SYSTEM_HEALTH_RAG_LINK.href);
  });

  it("renders full variant with why-two", () => {
    render(<RagHealthSystemHealthVocabularyRail currentSurfaceId="rag-health" variant="full" />);

    const strip = screen.getByTestId("rag-health-system-health-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(RAG_HEALTH_SYSTEM_HEALTH_HEADING)).toBeInTheDocument();
    expect(screen.getByText(RAG_HEALTH_SYSTEM_HEALTH_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("rag-health-system-health-vocabulary-current")).toHaveTextContent(
      RAG_HEALTH_SYSTEM_HEALTH_RAG_LINK.label,
    );
  });
});
