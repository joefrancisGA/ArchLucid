import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";

describe("HelpTopicTitleRow", () => {
  it("renders the book icon before the title for screen-reader-neutral decoration", () => {
    render(<HelpTopicTitleRow title="Getting started" titleTestId="help-getting-started-title" />);

    expect(screen.getByTestId("help-topic-page-icon")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("heading", { level: 1, name: "Getting started" })).toHaveAttribute(
      "data-testid",
      "help-getting-started-title",
    );
  });

  it("renders optional header actions beside the title", () => {
    render(
      <HelpTopicTitleRow
        title="Alerts"
        actions={<button type="button">Refresh</button>}
      />,
    );

    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-page-icon")).toBeInTheDocument();
  });
});
