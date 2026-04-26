import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ContextualHelp", () => ({
  ContextualHelp: ({ helpKey }: { helpKey: string }) => (
    <span data-testid="contextual-help">{helpKey}</span>
  ),
}));

import { OperatorPageHeader } from "@/components/OperatorPageHeader";

describe("OperatorPageHeader", () => {
  it("renders title as h2", () => {
    render(<OperatorPageHeader title="Test Title" />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Test Title");
  });

  it("renders subtitle when provided", () => {
    render(<OperatorPageHeader title="T" subtitle="A secondary line" />);
    expect(screen.getByText("A secondary line")).toBeInTheDocument();
  });

  it("omits subtitle when not provided", () => {
    const { container } = render(<OperatorPageHeader title="T" />);
    const subtitleP = container.querySelector("header > p");
    expect(subtitleP).toBeNull();
  });

  it("renders ContextualHelp when helpKey provided", () => {
    render(<OperatorPageHeader title="T" helpKey="some-key" />);
    const help = screen.getByTestId("contextual-help");
    expect(help).toHaveTextContent("some-key");
  });

  it("omits ContextualHelp when helpKey not provided", () => {
    render(<OperatorPageHeader title="T" />);
    expect(screen.queryByTestId("contextual-help")).toBeNull();
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
