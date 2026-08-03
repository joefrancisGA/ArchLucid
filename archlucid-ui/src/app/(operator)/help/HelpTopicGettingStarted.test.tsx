import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/getting-started",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { HelpGettingStartedGuideView } from "@/app/(operator)/help/_sections/HelpGettingStartedGuideView";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer-polish-copy";
import {
  GETTING_STARTED_HELP_PATH,
  GETTING_STARTED_HELP_QUICK_START_TITLE,
  GETTING_STARTED_HELP_SOURCES,
  GETTING_STARTED_HELP_SUBTITLE,
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

describe("HelpGettingStartedGuideView", () => {
  const entry = getProductDocumentationEntry("getting-started");

  it("registers the getting started guide entry", () => {
    expect(entry?.title).toBe("Getting started");
    expect(entry?.slug).toBe("getting-started");
    expect(entry?.summary).toContain("review findings");
  });

  it("renders quick-start card with primary actions near the top", () => {
    if (entry === undefined) {
      throw new Error("Expected getting-started documentation entry.");
    }

    render(<HelpGettingStartedGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: "Getting started" })).toBeInTheDocument();
    expect(screen.getByText(GETTING_STARTED_HELP_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("getting-started-quick-start-card")).toBeInTheDocument();

    const quickStart = screen.getByTestId("getting-started-quick-start-card");
    expect(within(quickStart).getByText(GETTING_STARTED_HELP_QUICK_START_TITLE)).toBeInTheDocument();
    expect(within(quickStart).getByRole("link", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA })).toHaveAttribute(
      "href",
      "/architecture/reviews/new",
    );
    expect(within(quickStart).getByRole("link", { name: "Open completed sample" })).toBeInTheDocument();
    expect(within(quickStart).getByRole("link", { name: "View first review guide" })).toHaveAttribute(
      "href",
      "/help/first-architecture-review",
    );
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

  it("shows action cards for what to do next", () => {
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
  });

  it("keeps internal implementation terms inside the administrator disclosure", () => {
    if (entry === undefined) {
      throw new Error("Expected getting-started documentation entry.");
    }

    render(<HelpGettingStartedGuideView entry={entry} />);

    const quickStart = screen.getByTestId("getting-started-quick-start-card");
    const vocabulary = screen.getByTestId("getting-started-plain-language-table");
    const stepper = screen.getByTestId("getting-started-workflow-stepper");
    const diagram = screen.getByTestId("getting-started-mental-model-diagram");

    for (const banned of BANNED_DEFAULT_VIEW_COPY) {
      expect(within(quickStart).queryByText(new RegExp(banned, "i"))).not.toBeInTheDocument();
      expect(within(vocabulary).queryByText(new RegExp(banned, "i"))).not.toBeInTheDocument();
      expect(within(stepper).queryByText(new RegExp(banned, "i"))).not.toBeInTheDocument();
      expect(within(diagram).queryByText(new RegExp(banned, "i"))).not.toBeInTheDocument();
    }

    const technical = screen.getByTestId("getting-started-technical-details");
    expect(within(technical).getByText(/runId/i)).toBeInTheDocument();
  });
});
