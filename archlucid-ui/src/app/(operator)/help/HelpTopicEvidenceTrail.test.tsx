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

vi.mock("@/components/help/HelpTopicPdfDownloadButton", () => ({
  HelpTopicPdfDownloadButton: () => null,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => null,
}));

import { HelpEvidenceTrailGuideView } from "@/app/(operator)/help/_sections/HelpEvidenceTrailGuideView";
import { AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL } from "@/lib/empty-state-presets";
import { BUYER_EVIDENCE_TRAIL_LOAD_BUTTON } from "@/lib/buyer/buyer-polish-copy";
import {
  EVIDENCE_TRAIL_HELP_CLAIM_DISCIPLINE,
  EVIDENCE_TRAIL_HELP_PRIMARY_ACTION,
} from "@/lib/evidence-trail-help-evidence-copy";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

/** TB-1363 — sample graph path must identify the Claims Intake demo. */
const EVIDENCE_TRAIL_SAMPLE_HONESTY_MARKERS = [
  "Claims Intake",
  "illustrative",
  "sample evidence graph",
] as const;

const EVIDENCE_TRAIL_GRAPH_MODES = [
  "Evidence provenance",
  "Decision traceability",
  "Architecture context",
] as const;

const EVIDENCE_TRAIL_LINEAGE_NODES = [
  "evidence and artifacts",
  "findings",
  "approval decisions",
  "Finalized review record",
  "exports and downloads",
] as const;

const BANNED_DIAGRAM_COPY = ["GraphMode", "review-trail", "/v1/", "POST /", "GET /"] as const;

const RETIRED_GRAPH_ROUTE = "/graph";

function assertNoRetiredGraphRouteLiteral(text: string): void {
  const withoutCanonicalPath = text.replaceAll(EVIDENCE_GRAPH_PATH, "");

  expect(withoutCanonicalPath, "rendered body must not reference retired /graph route").not.toContain(
    RETIRED_GRAPH_ROUTE,
  );
}

function renderEvidenceTrailHelp(): void {
  const loaded = tryLoadProductDocumentation("evidence-trail");

  if (loaded === null) {
    throw new Error("Expected evidence-trail documentation to load.");
  }

  render(<HelpEvidenceTrailGuideView entry={loaded.entry} markdown={loaded.markdown} />);
}

describe("HelpEvidenceTrailGuideView (TB-1360–TB-1364)", () => {
  const loaded = tryLoadProductDocumentation("evidence-trail");

  it("loads evidence-trail markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("operator guide copy discloses Claims Intake sample universe honesty and quotes shipped sample CTA", () => {
    if (loaded === null) {
      throw new Error("Expected evidence-trail documentation to load.");
    }

    const normalizedMarkdown = loaded.markdown.replace(/\*\*/g, "");

    for (const marker of EVIDENCE_TRAIL_SAMPLE_HONESTY_MARKERS) {
      expect(normalizedMarkdown, `expected marker: ${marker}`).toContain(marker);
    }

    expect(normalizedMarkdown).toContain(AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL);
    assertNoRetiredGraphRouteLiteral(normalizedMarkdown);
  });

  it("renders specialty guide chrome with primary action, secondary CTAs, and claim discipline", () => {
    renderEvidenceTrailHelp();

    expect(screen.getByTestId("help-evidence-trail-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-evidence-trail-first-viewport")).toBeInTheDocument();

    const primaryAction = screen.getByTestId(EVIDENCE_TRAIL_HELP_PRIMARY_ACTION.testId);

    expect(primaryAction).toHaveAttribute("href", EVIDENCE_GRAPH_PATH);
    expect(primaryAction).toHaveTextContent(EVIDENCE_TRAIL_HELP_PRIMARY_ACTION.label);

    expect(screen.getByTestId("help-evidence-trail-load-graph")).toHaveTextContent(
      BUYER_EVIDENCE_TRAIL_LOAD_BUTTON,
    );
    expect(screen.getByTestId("help-evidence-trail-open-sample-graph")).toHaveTextContent(
      AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL,
    );

    const claimDiscipline = screen.getByTestId("evidence-trail-help-claim-discipline");

    expect(claimDiscipline).toHaveTextContent(EVIDENCE_TRAIL_HELP_CLAIM_DISCIPLINE);
    expect(claimDiscipline).toHaveTextContent("not a full audit export");

    const exportActions = screen.getByTestId("help-topic-export-actions");

    expect(exportActions.querySelectorAll("a, button").length).toBeGreaterThan(0);
  });

  it("exposes finding trace and provenance graph deep links without review-trail mode (TB-1361)", () => {
    renderEvidenceTrailHelp();

    const traceLink = screen.getByTestId("help-evidence-trail-finding-trace-link");
    const graphLink = screen.getByTestId("help-evidence-trail-finding-graph-link");

    expect(traceLink.getAttribute("href")).toContain("/evidence-trace");
    expect(graphLink.getAttribute("href")).toContain("mode=provenance-full");
    expect(graphLink.getAttribute("href")).not.toContain("review-trail");
  });

  it("lists at most three related guides in specialty chrome (TB-1362)", () => {
    renderEvidenceTrailHelp();

    expect(screen.getAllByTestId("help-evidence-trail-related-guides-links")[0].querySelectorAll("li").length).toBeLessThanOrEqual(
      3,
    );
  });

  it("rendered help body keeps sample-universe honesty visible", () => {
    renderEvidenceTrailHelp();

    const visible = document.body.textContent ?? "";

    for (const marker of EVIDENCE_TRAIL_SAMPLE_HONESTY_MARKERS) {
      expect(visible, `expected rendered marker: ${marker}`).toContain(marker);
    }

    expect(visible).toContain(AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL);
    assertNoRetiredGraphRouteLiteral(visible);
  });

  it("shows provenance lineage diagram and a text equivalent in the default viewport", () => {
    renderEvidenceTrailHelp();

    expect(screen.getByRole("heading", { name: "What the evidence trail shows" })).toBeInTheDocument();

    const diagram = screen.getByTestId("help-evidence-trail-provenance-diagram");
    expect(diagram).toHaveTextContent("subgraph intake");
    expect(diagram).toHaveTextContent("Evidence and artifacts");
    expect(diagram).toHaveTextContent("Findings");
    expect(diagram).toHaveTextContent("Governance decisions");
    expect(diagram).toHaveTextContent("Finalized review record");
    expect(diagram).toHaveTextContent("Exports and downloads");

    const diagramText = diagram.textContent ?? "";

    for (const phrase of BANNED_DIAGRAM_COPY) {
      expect(diagramText, `diagram should not contain "${phrase}"`).not.toContain(phrase);
    }

    const visible = document.body.textContent ?? "";

    for (const node of EVIDENCE_TRAIL_LINEAGE_NODES) {
      expect(visible, `expected lineage node in visible prose: ${node}`).toContain(node);
    }

    for (const mode of EVIDENCE_TRAIL_GRAPH_MODES) {
      expect(visible, `expected graph mode vocabulary: ${mode}`).toContain(mode);
    }
  });
});
