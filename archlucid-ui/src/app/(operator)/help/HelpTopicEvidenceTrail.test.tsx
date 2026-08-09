import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({ source }: { readonly source: string }) => (
    <div data-testid="help-evidence-trail-provenance-diagram">{source}</div>
  ),
}));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

/** TB-1363 — sample graph path must disclose Claims Intake demo, not tenant workspace. */
const EVIDENCE_TRAIL_SAMPLE_HONESTY_MARKERS = [
  "Claims Intake",
  "not your workspace",
  "not a review from your tenant",
] as const;

const EVIDENCE_TRAIL_SAMPLE_VAGUE_PHRASES = ["Open sample evidence graph", "sample evidence graph"] as const;

const EVIDENCE_TRAIL_GRAPH_MODES = [
  "Evidence provenance",
  "Decision traceability",
  "Architecture context",
] as const;

const BANNED_DIAGRAM_COPY = ["GraphMode", "review-trail", "/v1/", "POST /", "GET /"] as const;

describe("HelpTopicMarkdownView evidence-trail (TB-1363)", () => {
  const loaded = tryLoadProductDocumentation("evidence-trail");

  it("loads evidence-trail markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("operator guide copy discloses Claims Intake sample universe honesty", () => {
    if (loaded === null) {
      throw new Error("Expected evidence-trail documentation to load.");
    }

    const normalizedMarkdown = loaded.markdown.replace(/\*\*/g, "");

    for (const marker of EVIDENCE_TRAIL_SAMPLE_HONESTY_MARKERS) {
      expect(normalizedMarkdown, `expected marker: ${marker}`).toContain(marker);
    }

    for (const vague of EVIDENCE_TRAIL_SAMPLE_VAGUE_PHRASES) {
      expect(normalizedMarkdown, `vague phrase still present: ${vague}`).not.toContain(vague);
    }
  });

  it("rendered help body keeps sample-universe honesty visible", () => {
    if (loaded === null) {
      throw new Error("Expected evidence-trail documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = document.body.textContent ?? "";

    for (const marker of EVIDENCE_TRAIL_SAMPLE_HONESTY_MARKERS) {
      expect(visible, `expected rendered marker: ${marker}`).toContain(marker);
    }
  });

  it("shows provenance lineage diagram in the default viewport without disclosures", () => {
    if (loaded === null) {
      throw new Error("Expected evidence-trail documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} showContextualHelp />);

    expect(screen.getByRole("heading", { name: "What the evidence trail shows" })).toBeInTheDocument();

    const diagram = screen.getByTestId("help-evidence-trail-provenance-diagram");
    expect(diagram).toHaveTextContent("subgraph intake");
    expect(diagram).toHaveTextContent("Evidence and artifacts");
    expect(diagram).toHaveTextContent("Findings");
    expect(diagram).toHaveTextContent("Governance decisions");
    expect(diagram).toHaveTextContent("Signed review record");
    expect(diagram).toHaveTextContent("Exports and downloads");

    const diagramText = diagram.textContent ?? "";

    for (const phrase of BANNED_DIAGRAM_COPY) {
      expect(diagramText, `diagram should not contain "${phrase}"`).not.toContain(phrase);
    }

    const visible = document.body.textContent ?? "";

    for (const mode of EVIDENCE_TRAIL_GRAPH_MODES) {
      expect(visible, `expected graph mode vocabulary: ${mode}`).toContain(mode);
    }
  });
});
