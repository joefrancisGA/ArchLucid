import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpTechnicalReferenceNavigation } from "@/components/help/HelpTechnicalReferenceNavigation";
import { groupHelpMarkdownHeadings } from "@/lib/help/help-markdown-heading-groups";
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";

const SAMPLE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { id: "running-the-cli", title: "Running the CLI", level: 2 },
  { id: "global-json", title: "Global `--json`", level: 3 },
  { id: "api-url", title: "API URL", level: 2 },
  { id: "commands", title: "Commands", level: 2 },
  { id: "archlucid-try", title: "archlucid try", level: 2 },
  { id: "flags", title: "Flags", level: 3 },
  { id: "exit-codes", title: "Exit codes", level: 2 },
];

describe("HelpTechnicalReferenceNavigation", () => {
  const groups = groupHelpMarkdownHeadings(SAMPLE_HEADINGS);

  it("renders hierarchical groups with a filter input and match summary", () => {
    render(<HelpTechnicalReferenceNavigation groups={groups} />);

    const desktopNav = screen.getByTestId("help-technical-reference-toc");

    expect(within(desktopNav).getByTestId("help-technical-reference-toc-heading")).toHaveTextContent(
      "Reference index",
    );
    expect(within(desktopNav).getByTestId("help-technical-reference-search")).toBeInTheDocument();
    expect(within(desktopNav).getByTestId("help-technical-reference-search-summary")).toHaveTextContent(
      "7 indexed entries",
    );
    expect(within(desktopNav).getByTestId("help-technical-reference-group-running-the-cli")).toBeInTheDocument();
    expect(within(desktopNav).getByRole("link", { name: "Global `--json`" })).toHaveAttribute(
      "href",
      "#global-json",
    );
  });

  it("filters sections and reports no matches honestly", () => {
    render(<HelpTechnicalReferenceNavigation groups={groups} />);

    const desktopNav = screen.getByTestId("help-technical-reference-toc");
    const searchInput = within(desktopNav).getByTestId("help-technical-reference-search");

    fireEvent.change(searchInput, { target: { value: "exit" } });

    expect(within(desktopNav).getByTestId("help-technical-reference-search-summary")).toHaveTextContent(
      "1 matching entry",
    );
    expect(within(desktopNav).getByRole("link", { name: "Exit codes" })).toBeInTheDocument();
    expect(within(desktopNav).queryByRole("link", { name: "Commands" })).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "missing-section" } });

    expect(within(desktopNav).getByTestId("help-technical-reference-search-empty")).toBeInTheDocument();
  });

  it("marks the hash-matched section as the current location", () => {
    window.location.hash = "#exit-codes";

    render(<HelpTechnicalReferenceNavigation groups={groups} />);

    const desktopNav = screen.getByTestId("help-technical-reference-toc");

    expect(within(desktopNav).getByRole("link", { name: "Exit codes" })).toHaveAttribute("aria-current", "location");
  });
});
