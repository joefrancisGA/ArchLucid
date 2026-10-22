import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MermaidDiagram } from "@/components/help/MermaidDiagram";

const renderMock = vi.fn().mockResolvedValue({
  svg: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" style="max-width: 120px;" viewBox="0 0 120 40" data-testid="rendered-mermaid"></svg>',
});
const initializeMock = vi.fn();

vi.mock("mermaid", () => ({
  default: {
    initialize: initializeMock,
    render: renderMock,
  },
}));

describe("MermaidDiagram", () => {
  beforeEach(() => {
    class ImmediateIntersectionObserver implements IntersectionObserver {
      readonly root: Element | Document | null = null;
      readonly rootMargin = "0px";
      readonly thresholds: ReadonlyArray<number> = [0];

      constructor(private readonly callback: IntersectionObserverCallback) {}

      observe(target: Element): void {
        this.callback(
          [
            {
              isIntersecting: true,
              target,
              intersectionRatio: 1,
              time: 0,
              boundingClientRect: target.getBoundingClientRect(),
              intersectionRect: target.getBoundingClientRect(),
              rootBounds: null,
            },
          ],
          this,
        );
      }

      unobserve(): void {}

      disconnect(): void {}

      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }

    vi.stubGlobal("IntersectionObserver", ImmediateIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders mermaid output instead of raw source by default", async () => {
    render(<MermaidDiagram source={"flowchart LR\n  A --> B"} accessibleName="Sample help diagram" />);

    expect(screen.getByText("Rendering diagram…")).toBeInTheDocument();
    expect(screen.queryByText("flowchart LR")).toBeNull();

    await waitFor(() => {
      expect(screen.getByTestId("rendered-mermaid")).toBeInTheDocument();
    });

    expect(initializeMock).toHaveBeenCalled();
    expect(renderMock).toHaveBeenCalledWith(expect.stringMatching(/^help-mermaid-/), "flowchart LR\n  A --> B");
  });

  it("keeps raw source behind a collapsed disclosure", async () => {
    render(<MermaidDiagram source={"flowchart LR\n  A --> B"} accessibleName="Sample help diagram" />);

    await waitFor(() => {
      expect(screen.getByTestId("rendered-mermaid")).toBeInTheDocument();
    });

    expect(screen.getByText("View diagram source")).toBeInTheDocument();
  });

  it("scales the SVG host to the full frame width", async () => {
    render(<MermaidDiagram source={"flowchart LR\n  A --> B"} accessibleName="Sample help diagram" />);

    await waitFor(() => {
      expect(screen.getByTestId("mermaid-diagram-svg-host")).toBeInTheDocument();
    });

    expect(screen.getByTestId("mermaid-diagram-svg-host").className).toContain("w-full");
    expect(screen.getByTestId("rendered-mermaid").getAttribute("width")).toBe("100%");
  });

  it("exposes accessible name and optional description on the figure", async () => {
    render(
      <MermaidDiagram
        source={"flowchart LR\n  A --> B"}
        accessibleName="Compare vs replay decision flow"
        description="Text alternative for the decision diagram."
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("rendered-mermaid")).toBeInTheDocument();
    });

    expect(screen.getByRole("img", { name: "Compare vs replay decision flow" })).toBeInTheDocument();
    expect(screen.getByText("Text alternative for the decision diagram.")).toBeInTheDocument();
    expect(screen.getByTestId("mermaid-diagram-svg-host")).toHaveAttribute("aria-hidden", "true");
  });

  it("passes optional theme variables to mermaid initialization", async () => {
    render(
      <MermaidDiagram
        source={"flowchart LR\n  A --> B"}
        accessibleName="Sample help diagram"
        themeVariables={{ fontSize: "16px", primaryTextColor: "#171717" }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("rendered-mermaid")).toBeInTheDocument();
    });

    expect(initializeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        themeVariables: { fontSize: "16px", primaryTextColor: "#171717" },
      }),
    );
  });
});
