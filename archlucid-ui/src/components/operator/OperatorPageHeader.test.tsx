import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";

describe("OperatorPageHeader", () => {
  it("renders title as h2 without adjacent tooltip triggers", () => {
    render(
      <OperatorPageHeader
        title="Test Title"
        helpKey="some-key"
        buyerTitleHint="Section purpose line."
        docsPageKey="/insights/compare-two-reviews"
      />,
    );

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Test Title");
    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("[data-help-tooltip-trigger]")).toBeNull();
  });

  it("renders subtitle when provided", () => {
    render(<OperatorPageHeader title="T" subtitle="A secondary line" />);
    expect(screen.getByText("A secondary line")).toBeInTheDocument();
  });

  it("renders full-width subtitle by default and allows optional measure override", () => {
    const { rerender } = render(<OperatorPageHeader title="T" subtitle="Default measure" />);

    expect(screen.getByText("Default measure").className).not.toContain("max-w-2xl");
    expect(screen.getByText("Default measure").className).not.toContain("max-w-3xl");

    rerender(<OperatorPageHeader title="T" subtitle="Reading measure" subtitleClassName="max-w-3xl" />);

    expect(screen.getByText("Reading measure").className).toContain("max-w-3xl");
  });

  it("omits subtitle when not provided", () => {
    const { container } = render(<OperatorPageHeader title="T" />);
    const subtitleP = container.querySelector("header > p");
    expect(subtitleP).toBeNull();
  });

  it("renders actions right-aligned with ml-auto container", () => {
    render(
      <OperatorPageHeader
        title="T"
        actions={<button type="button">Do thing</button>}
      />,
    );
    const button = screen.getByRole("button", { name: "Do thing" });
    const wrapper = button.parentElement!;
    expect(wrapper.className).toContain("ml-auto");
  });

  it("renders metadata when provided", () => {
    render(
      <OperatorPageHeader
        title="T"
        metadata={<span data-testid="meta">v1.2.3</span>}
      />,
    );
    expect(screen.getByTestId("meta")).toHaveTextContent("v1.2.3");
  });

  it("renders children below the header", () => {
    render(
      <OperatorPageHeader title="T">
        <div data-testid="child-content">Extra stuff</div>
      </OperatorPageHeader>,
    );
    const child = screen.getByTestId("child-content");
    expect(child).toHaveTextContent("Extra stuff");
    const wrapper = child.parentElement!;
    expect(wrapper.className).toContain("mt-4");
  });
});
