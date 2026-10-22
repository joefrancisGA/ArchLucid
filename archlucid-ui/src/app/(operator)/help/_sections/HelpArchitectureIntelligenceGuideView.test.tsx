import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpArchitectureIntelligenceGuideView } from "@/app/(operator)/help/_sections/HelpArchitectureIntelligenceGuideView";
import {
  ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_INTELLIGENCE_HELP_DATA_HANDLING_CLAUSE,
  ARCHITECTURE_INTELLIGENCE_HELP_DATA_HANDLING_LINK,
  ARCHITECTURE_INTELLIGENCE_HELP_SOURCES,
} from "@/lib/architecture-intelligence-help-evidence-copy";
import {
  ARCHITECTURE_INTELLIGENCE_HELP_FEATURE_ITEMS,
  ARCHITECTURE_INTELLIGENCE_HELP_GUIDE_HEADINGS,
  ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION,
  ARCHITECTURE_INTELLIGENCE_HELP_START_HERE_CARD_TITLE,
  ARCHITECTURE_INTELLIGENCE_HELP_START_HERE_SCOPE_NOTE,
} from "@/lib/architecture-intelligence-help-guide-content";
import { ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL } from "@/lib/architecture/architecture-intelligence-evidence-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpArchitectureIntelligenceGuideView", () => {
  const entry = getProductDocumentationEntry("architecture-intelligence");

  it("renders provenance, linked capability tiles, and header claim discipline", () => {
    if (entry === undefined) {
      throw new Error("Expected architecture-intelligence documentation entry.");
    }

    const sourceHrefs = ARCHITECTURE_INTELLIGENCE_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);

    render(<HelpArchitectureIntelligenceGuideView entry={entry} />);

    expect(screen.getByTestId("help-architecture-intelligence-guide")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-08-13");
    expect(screen.getByTestId("help-architecture-intelligence-start-here-scope-note")).toHaveTextContent(
      ARCHITECTURE_INTELLIGENCE_HELP_START_HERE_SCOPE_NOTE,
    );
    expect(screen.queryByTestId("help-architecture-intelligence-role-precondition-tag")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-architecture-intelligence-data-handling")).toHaveTextContent(
      ARCHITECTURE_INTELLIGENCE_HELP_DATA_HANDLING_CLAUSE,
    );
    expect(screen.getByRole("link", { name: ARCHITECTURE_INTELLIGENCE_HELP_DATA_HANDLING_LINK.label })).toHaveAttribute(
      "href",
      ARCHITECTURE_INTELLIGENCE_HELP_DATA_HANDLING_LINK.href,
    );
    expect(screen.getByTestId("help-architecture-intelligence-header-claim-discipline")).toHaveTextContent(
      ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.queryByTestId("help-architecture-intelligence-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: ARCHITECTURE_INTELLIGENCE_HELP_START_HERE_CARD_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION.label })).toHaveLength(2);

    for (const item of ARCHITECTURE_INTELLIGENCE_HELP_FEATURE_ITEMS) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
    }

    const linkedHrefs = [
      ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION.href,
      ...ARCHITECTURE_INTELLIGENCE_HELP_FEATURE_ITEMS.map((item) => item.href),
    ];

    expect(new Set(linkedHrefs).size).toBe(linkedHrefs.length);

    const sourcesSection = screen.getByTestId("help-architecture-intelligence-sources");

    for (const source of ARCHITECTURE_INTELLIGENCE_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(screen.getByRole("link", { name: "Read Model policy help" })).toHaveAttribute(
      "href",
      "/help/model-governance",
    );
    expect(screen.getByRole("link", { name: "Read AI usage help" })).toHaveAttribute("href", "/help/ai-usage");
    expect(screen.queryByRole("link", { name: "Open findings queue →" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Start a review →" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Open evidence graph →" })).toBeNull();
    expect(screen.getByTestId("help-architecture-intelligence-overview").textContent?.toLowerCase()).not.toContain(
      "golden regression",
    );
    expect(screen.getByTestId("help-architecture-intelligence-how-stepper").textContent?.toLowerCase()).not.toContain(
      "golden harness",
    );

    for (const heading of ARCHITECTURE_INTELLIGENCE_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});
