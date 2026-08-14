import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpArchitectureIntelligenceGuideView } from "@/app/(operator)/help/_sections/HelpArchitectureIntelligenceGuideView";
import {
  ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE_HEADING,
  ARCHITECTURE_INTELLIGENCE_HELP_SOURCES,
} from "@/lib/architecture-intelligence-help-evidence-copy";
import {
  ARCHITECTURE_INTELLIGENCE_HELP_FEATURE_ITEMS,
  ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION,
  ARCHITECTURE_INTELLIGENCE_HELP_START_HERE_CARD_TITLE,
} from "@/lib/architecture-intelligence-help-guide-content";
import { ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL } from "@/lib/architecture/architecture-intelligence-evidence-copy";
import { HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpArchitectureIntelligenceGuideView", () => {
  const entry = getProductDocumentationEntry("architecture-intelligence");

  it("renders breadcrumb, provenance, linked capability tiles, and claim discipline heading", () => {
    if (entry === undefined) {
      throw new Error("Expected architecture-intelligence documentation entry.");
    }

    const sourceHrefs = ARCHITECTURE_INTELLIGENCE_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);

    render(<HelpArchitectureIntelligenceGuideView entry={entry} />);

    expect(screen.getByTestId("help-architecture-intelligence-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: HELP_TOPIC_BREADCRUMB_HUB_LABEL })).toHaveAttribute("href", "/help");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Last reviewed 2026-08-13 · architecture intelligence orientation",
    );
    expect(screen.getByRole("heading", { name: ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("help-architecture-intelligence-claim-discipline").textContent).toContain(
      ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("help-architecture-intelligence-claim-discipline").textContent).toContain(
      "tenant-scoped",
    );
    expect(screen.getByRole("heading", { name: ARCHITECTURE_INTELLIGENCE_HELP_START_HERE_CARD_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION.label })).toHaveLength(1);

    for (const item of ARCHITECTURE_INTELLIGENCE_HELP_FEATURE_ITEMS) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
    }

    expect(screen.getByRole("link", { name: "Model governance help" })).toHaveAttribute(
      "href",
      "/help/model-governance",
    );
    expect(screen.getByRole("link", { name: "AI usage help" })).toHaveAttribute("href", "/help/ai-usage");
    expect(screen.queryByRole("link", { name: "Open findings queue →" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Start a review →" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Open evidence graph →" })).toBeNull();
    expect(screen.getByTestId("help-architecture-intelligence-overview").textContent?.toLowerCase()).not.toContain(
      "golden regression",
    );
    expect(screen.getByTestId("help-architecture-intelligence-how-stepper").textContent?.toLowerCase()).not.toContain(
      "golden harness",
    );
  });
});
