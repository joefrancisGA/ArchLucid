import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { HELP_PAGE_TOC } from "@/lib/help/help-page-layout";
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";

const SAMPLE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { id: "pilot-first", title: "Pilot first. Operate later.", level: 2 },
  { id: "four-step-path", title: "Four-step first-review path", level: 2 },
  { id: "what-can-wait", title: "What can wait until later", level: 2 },
  { id: "session-tip", title: "Recommended first session", level: 2 },
  { id: "nested-tip", title: "Prepare evidence", level: 3 },
  { id: "related-guides", title: "Related guides", level: 2 },
];

describe("HelpTopicTableOfContents", () => {
  it("does not render when fewer than four headings are provided", () => {
    const { container } = render(
      <HelpTopicTableOfContents
        headings={[
          { id: "one", title: "One", level: 2 },
          { id: "two", title: "Two", level: 2 },
          { id: "three", title: "Three", level: 2 },
        ]}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the on-this-page heading and anchor links", () => {
    render(<HelpTopicTableOfContents headings={SAMPLE_HEADINGS} />);

    const desktopToc = screen.getByTestId("help-topic-toc");
    const heading = within(desktopToc).getByTestId("help-topic-toc-heading");

    expect(heading).toHaveTextContent("On this page");
    expect(heading).toHaveClass("font-semibold");
    expect(heading.className).toContain(HELP_PAGE_TOC.heading);

    for (const item of SAMPLE_HEADINGS) {
      expect(within(desktopToc).getByRole("link", { name: item.title })).toHaveAttribute("href", `#${item.id}`);
    }

    const list = within(desktopToc).getByRole("list");

    expect(list.className).not.toContain("overflow-y");
    expect(list.className).not.toContain("max-h");
  });

  it("marks the hash-matched section as the current location", () => {
    window.location.hash = "#what-can-wait";

    render(<HelpTopicTableOfContents headings={SAMPLE_HEADINGS} />);

    const desktopToc = screen.getByTestId("help-topic-toc");

    expect(within(desktopToc).getByRole("link", { name: "What can wait until later" })).toHaveAttribute(
      "aria-current",
      "location",
    );
    expect(within(desktopToc).getByRole("link", { name: "Pilot first. Operate later." })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("updates the active link when the location hash changes", () => {
    window.location.hash = "";

    render(<HelpTopicTableOfContents headings={SAMPLE_HEADINGS} />);

    const desktopToc = screen.getByTestId("help-topic-toc");
    const relatedLink = within(desktopToc).getByRole("link", { name: "Related guides" });

    expect(relatedLink).not.toHaveAttribute("aria-current");

    window.location.hash = "#related-guides";
    fireEvent(window, new HashChangeEvent("hashchange"));

    expect(relatedLink).toHaveAttribute("aria-current", "location");
  });
});
