import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({
    source,
    description,
  }: {
    readonly source: string;
    readonly description?: string;
  }) => (
    <div data-testid="mermaid-diagram" data-description={description ?? ""}>{source}</div>
  ),
}));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/getting-started",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

import { HelpGettingStartedGuideView } from "@/app/(operator)/help/_sections/HelpGettingStartedGuideView";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA } from "@/lib/golden-sponsor-package-walkthrough";
import {
  GETTING_STARTED_HELP_DIAGRAM_SOURCE,
  GETTING_STARTED_HELP_PATH,
  GETTING_STARTED_HELP_PIPELINE_TEXT_STAGES,
  GETTING_STARTED_HELP_QUICK_START_TITLE,
  GETTING_STARTED_HELP_SOURCES,
  GETTING_STARTED_HELP_TECHNICAL_DETAILS_TITLE,
} from "@/lib/getting-started-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

const BANNED_DEFAULT_VIEW_COPY = [
  "runId",
  "ContextSnapshot",
  "IAuthorityRunOrchestrator",
  "ExplainabilityTrace",
  "manifest ids in API and storage",
  "After commit:",
  "Diagram (mental model)",
  "Seven terms (plain language)",
  "Approval queue",
] as const;

const BANNED_PRODUCT_NOUN_RUN = /\bRun record\b/i;

describe("HelpGettingStartedGuideView", () => {
  const entry = getProductDocumentationEntry("getting-started");

  it("registers the getting started guide entry", () => {
    expect(entry?.title).toBe("Getting started");
    expect(entry?.slug).toBe("getting-started");
    expect(entry?.summary).toContain("review findings");
    expect(entry?.lastReviewed).toBe("2026-08-09");
    expect(entry?.releaseApplicability).toBeTruthy();
  });

  it("renders shared help header chrome with status, provenance, and export actions", () => {
    if (entry === undefined) {
      throw new Error("Expected getting-started documentation entry.");
    }

    render(<HelpGettingStartedGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: "Getting started" })).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-page-title")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-export-actions")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
  });

  it("renders quick-start card with primary actions near the top", () => {
    if (entry === undefined) {
      throw new Error("Expected getting-started documentation entry.");
    }

    render(<HelpGettingStartedGuideView entry={entry} />);

    expect(screen.queryByTestId("help-getting-started-sources")).toBeNull();
    expect(screen.getByTestId("help-getting-started-claim-discipline")).toHaveTextContent(
      /Orientation only|CPA SOC 2|third-party pen/i,
    );
    expect(screen.getByTestId("help-getting-started-orientation-status")).toHaveTextContent("Orientation only");

    expect(GETTING_STARTED_HELP_SOURCES.some((link) => link.href === GETTING_STARTED_HELP_PATH)).toBe(false);
    expect(screen.getByTestId("getting-started-quick-start-card")).toBeInTheDocument();

    const quickStart = screen.getByTestId("getting-started-quick-start-card");
    expect(within(quickStart).getByText(GETTING_STARTED_HELP_QUICK_START_TITLE)).toBeInTheDocument();
    expect(within(quickStart).getByRole("link", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA })).toHaveAttribute(
      "href",
      "/architecture/reviews/new",
    );
    expect(within(quickStart).getByRole("link", { name: GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA })).toBeInTheDocument();
    expect(within(quickStart).getByRole("link", { name: "View first review guide" })).toHaveAttribute(
      "href",
      "/help/first-architecture-review",
    );
  });

  it("names section landmarks from h2 headings", () => {
    if (entry === undefined) {
      throw new Error("Expected getting-started documentation entry.");
    }

    render(<HelpGettingStartedGuideView entry={entry} />);

    expect(screen.getByRole("region", { name: "How ArchLucid works" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Plain-language vocabulary" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "What happens during a review?" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "What to do next" })).toBeInTheDocument();
  });

  it("shows a scannable mental model diagram and plain-language vocabulary", () => {
    if (entry === undefined) {
      throw new Error("Expected getting-started documentation entry.");
    }

    render(<HelpGettingStartedGuideView entry={entry} />);

    expect(screen.getByRole("heading", { name: "How ArchLucid works" })).toBeInTheDocument();
    expect(screen.getByTestId("getting-started-mental-model-diagram")).toBeInTheDocument();
    expect(screen.getByTestId("getting-started-plain-language-table")).toBeInTheDocument();
    expect(screen.getByText("Architecture package")).toBeInTheDocument();
    expect(screen.getByText("Governance approval")).toBeInTheDocument();
  });

  it("renders the authority pipeline with text stages and Mermaid diagram", () => {
    if (entry === undefined) {
      throw new Error("Expected getting-started documentation entry.");
    }

    render(<HelpGettingStartedGuideView entry={entry} />);

    const pipelineDiagram = screen.getByTestId("getting-started-pipeline-diagram");
    expect(
      within(pipelineDiagram).getByText(
        "Authority pipeline from architecture request through governance gate and committed outputs:",
      ),
    ).toBeInTheDocument();

    const textStages = within(pipelineDiagram).getByTestId("getting-started-pipeline-text-stages");
    for (const stage of GETTING_STARTED_HELP_PIPELINE_TEXT_STAGES) {
      expect(within(textStages).getByText(stage)).toBeInTheDocument();
    }

    const mermaid = within(pipelineDiagram).getByTestId("mermaid-diagram");
    expect(mermaid).toHaveTextContent("subgraph pipeline [Authority pipeline]");
    expect(mermaid).toHaveTextContent("gov{Governance gate}");
    expect(mermaid).toHaveTextContent("SR[Sealed review record]");
    expect(mermaid.getAttribute("data-description")).toMatch(/governance gate/i);
    expect(within(pipelineDiagram).queryByText(/Diagram source \(Mermaid\)/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("getting-started-pipeline-diagram-details")).not.toBeInTheDocument();
  });

  it("renders a five-step review workflow with expected outputs", () => {
    if (entry === undefined) {
      throw new Error("Expected getting-started documentation entry.");
    }

    render(<HelpGettingStartedGuideView entry={entry} />);

    const stepper = screen.getByTestId("getting-started-workflow-stepper");
    expect(within(stepper).getByRole("heading", { name: "Add architecture evidence" })).toBeInTheDocument();
    expect(within(stepper).getByRole("heading", { name: "Analyze the architecture" })).toBeInTheDocument();
    expect(within(stepper).getByRole("heading", { name: "Review findings" })).toBeInTheDocument();
    expect(within(stepper).getByRole("heading", { name: "Record decisions" })).toBeInTheDocument();
    expect(within(stepper).getByRole("heading", { name: "Finalize and share outputs" })).toBeInTheDocument();
    expect(within(stepper).getAllByText(/Expected outputs:/i).length).toBe(5);
  });

  it("shows action cards for what to do next with link-styled in-page vocabulary jump", () => {
    if (entry === undefined) {
      throw new Error("Expected getting-started documentation entry.");
    }

    render(<HelpGettingStartedGuideView entry={entry} />);

    const cards = screen.getByTestId("getting-started-next-action-cards");
    expect(within(cards).getByText("Start your first review")).toBeInTheDocument();
    expect(within(cards).getByText("Connect cloud evidence later")).toBeInTheDocument();
    expect(within(cards).getByRole("link", { name: "Cloud connections" })).toHaveAttribute(
      "href",
      "/integrations/cloud-connections",
    );

    const vocabularyLink = within(cards).getByRole("link", { name: "View vocabulary" });
    expect(vocabularyLink).toHaveAttribute("href", "#plain-language-vocabulary");
    expect(vocabularyLink.tagName).toBe("A");
  });

  it("keeps internal implementation terms inside the administrator disclosure", async () => {
    if (entry === undefined) {
      throw new Error("Expected getting-started documentation entry.");
    }

    render(<HelpGettingStartedGuideView entry={entry} />);

    const quickStart = screen.getByTestId("getting-started-quick-start-card");
    const vocabulary = screen.getByTestId("getting-started-plain-language-table");
    const stepper = screen.getByTestId("getting-started-workflow-stepper");
    const diagram = screen.getByTestId("getting-started-mental-model-diagram");
    const pipelineDiagram = screen.getByTestId("getting-started-pipeline-diagram");

    for (const banned of BANNED_DEFAULT_VIEW_COPY) {
      expect(within(quickStart).queryByText(new RegExp(banned, "i"))).not.toBeInTheDocument();
      expect(within(vocabulary).queryByText(new RegExp(banned, "i"))).not.toBeInTheDocument();
      expect(within(stepper).queryByText(new RegExp(banned, "i"))).not.toBeInTheDocument();
      expect(within(diagram).queryByText(new RegExp(banned, "i"))).not.toBeInTheDocument();
      expect(within(pipelineDiagram).queryByText(new RegExp(banned, "i"))).not.toBeInTheDocument();
    }

    expect(BANNED_PRODUCT_NOUN_RUN.test(GETTING_STARTED_HELP_DIAGRAM_SOURCE)).toBe(false);
    expect(within(pipelineDiagram).queryByText(BANNED_PRODUCT_NOUN_RUN)).not.toBeInTheDocument();

    const technical = screen.getByTestId("getting-started-technical-details");
    expect(technical).toBeInstanceOf(HTMLDetailsElement);
    fireEvent.click(within(technical).getByText(GETTING_STARTED_HELP_TECHNICAL_DETAILS_TITLE));
    await waitFor(() => {
      expect(within(technical).getByText(/runId/i)).toBeInTheDocument();
    });
  });
});
