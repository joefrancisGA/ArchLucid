import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();
const mermaidRenderMock = vi.fn(async () => ({
  svg: '<svg xmlns="http://www.w3.org/2000/svg"><text>A</text></svg>',
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/infrastructure/diagrams",
  useSearchParams: () => new URLSearchParams("diagZoom=1"),
  useRouter: () => ({
    push: vi.fn(),
    replace: replaceMock,
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: mermaidRenderMock,
  },
}));

import { ArchitectureDiagramViewer } from "@/components/architecture/ArchitectureDiagramViewer";

describe("ArchitectureDiagramViewer", () => {
  it("shows renderer failure and retry action", async () => {
    mermaidRenderMock.mockRejectedValueOnce(new Error("Renderer failed"));
    const onRetry = vi.fn();

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TB\n  a["A"]'}
        textAlternative="A"
        viewportAriaLabel="Inventory diagram for snapshot snap-1"
        fullscreenTitle="Inventory diagram · Executive"
        onRetry={onRetry}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("architecture-diagram-render-failure")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("renders sanitized svg in the viewport after mermaid succeeds", async () => {
    mermaidRenderMock.mockResolvedValueOnce({
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" /></svg>',
    });

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TB\n  a["A"]'}
        textAlternative="A"
        viewportAriaLabel="Inventory diagram for snapshot snap-1"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("architecture-diagram-viewport").querySelector("svg")).not.toBeNull();
    });
  });

  it("syncs zoom changes to the URL after user interaction", async () => {
    replaceMock.mockClear();

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TB\n  a["A"]'}
        textAlternative="A"
        viewportAriaLabel="Inventory diagram for snapshot snap-1"
        fullscreenTitle="Inventory diagram · Executive"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("architecture-diagram-viewport")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/governance/infrastructure/diagrams?diagZoom=1.25", {
        scroll: false,
      });
    });
  });
});
