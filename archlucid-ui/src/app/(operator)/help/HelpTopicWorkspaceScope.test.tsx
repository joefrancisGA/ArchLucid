import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpTopicMarkdownView workspace and scope guide", () => {
  const loaded = tryLoadProductDocumentation("scope");

  it("loads the workspace and scope guide markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("renders the page title as Workspace and scope guide", () => {
    if (loaded === null) {
      throw new Error("Expected scope documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("heading", { level: 1, name: "Workspace and scope guide" })).toBeInTheDocument();
  });

  it("renders the Three scope levels table with tenant, workspace, and project rows", () => {
    if (loaded === null) {
      throw new Error("Expected scope documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("heading", { name: "Three scope levels" })).toBeInTheDocument();
    expect(screen.getByText("Tenant")).toBeInTheDocument();
    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("Project")).toBeInTheDocument();
  });

  it("renders the Sample workspace section explaining demo data is not tenant data", () => {
    if (loaded === null) {
      throw new Error("Expected scope documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("heading", { name: "Sample workspace" })).toBeInTheDocument();
    expect(screen.getByText(/demonstration data only/i)).toBeInTheDocument();
    expect(screen.getByText(/not your real tenant data/i)).toBeInTheDocument();
    expect(screen.getByText(/workspace switching is disabled in demo mode/i)).toBeInTheDocument();
    expect(screen.getByText(/sign in to a connected environment/i)).toBeInTheDocument();
  });

  it("renders the When content looks wrong table with concise symptom rows", () => {
    if (loaded === null) {
      throw new Error("Expected scope documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("heading", { name: "When content looks wrong" })).toBeInTheDocument();
    expect(screen.getByText("Empty reviews list")).toBeInTheDocument();
    expect(screen.getByText("Review not found")).toBeInTheDocument();
    expect(screen.getByText("Sample badge unexpected")).toBeInTheDocument();
  });

  it("styles the Troubleshooting recovery reference as a real link", () => {
    if (loaded === null) {
      throw new Error("Expected scope documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const troubleshootingLinks = screen.getAllByRole("link", { name: "Troubleshooting" });

    expect(troubleshootingLinks.length).toBeGreaterThan(0);

    for (const link of troubleshootingLinks) {
      expect(link).toHaveAttribute("href", "/help/troubleshooting");
    }
  });

  it("renders Related help entries as accessible links with proper hrefs", () => {
    if (loaded === null) {
      throw new Error("Expected scope documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const relatedHelpHeading = screen.getByRole("heading", { name: "Related help" });
    const contentColumn = screen.getByTestId("help-topic-content");

    expect(within(contentColumn).getByRole("link", { name: "Getting started" })).toHaveAttribute(
      "href",
      "/help/getting-started",
    );
    expect(relatedHelpHeading).toBeInTheDocument();
  });

  it("does not use internal operator/runbook terminology in the rendered page", () => {
    if (loaded === null) {
      throw new Error("Expected scope documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const contentColumn = screen.getByTestId("help-topic-content");
    const renderedText = contentColumn.textContent ?? "";

    expect(renderedText).not.toMatch(/\boperator\b/i);
    expect(renderedText).not.toMatch(/\brunbook\b/i);
    expect(renderedText).not.toMatch(/operator shell/i);
  });
});
