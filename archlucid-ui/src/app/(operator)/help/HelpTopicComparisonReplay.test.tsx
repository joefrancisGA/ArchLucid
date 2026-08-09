import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({ source }: { readonly source: string }) => (
    <div data-testid="help-comparison-replay-decision-diagram">{source}</div>
  ),
}));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const BANNED_DIAGRAM_COPY = [
  "/v1/",
  "POST /",
  "GET /",
  "runId",
  "ComparisonRecord",
  "end-to-end-replay",
  "PayloadJson",
] as const;

describe("HelpTopicMarkdownView comparison-replay", () => {
  const loaded = tryLoadProductDocumentation("comparison-replay");

  it("loads comparison-replay help from customer guide source", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Compare and replay");
    expect(loaded?.entry.sourcePaths).toContain(
      "docs/library/customer-facing/COMPARISON_REPLAY_OPERATOR_GUIDE.md",
    );
  });

  it("shows compare vs replay decision diagram in the default viewport without disclosures", () => {
    if (loaded === null) {
      throw new Error("Expected comparison-replay documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} showContextualHelp />);

    expect(screen.getByRole("heading", { name: "When to compare" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "When to replay" })).toBeInTheDocument();

    const diagram = screen.getByTestId("help-comparison-replay-decision-diagram");
    expect(diagram).toHaveTextContent("Compare two reviews");
    expect(diagram).toHaveTextContent("Replay saved comparison");
    expect(diagram).toHaveTextContent("Replay with verify");
    expect(diagram).toHaveTextContent("Start a new architecture review");
    expect(diagram).toHaveTextContent("saved comparison record");
    expect(diagram).toHaveTextContent("delta narrative");

    const diagramText = diagram.textContent ?? "";

    for (const phrase of BANNED_DIAGRAM_COPY) {
      expect(diagramText, `diagram should not contain "${phrase}"`).not.toContain(phrase);
    }
  });
});
