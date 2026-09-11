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

  it("labels zoom controls and explains plus, minus, and 0", async () => {
    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TB\n  a["A"]'}
        textAlternative="A"
        viewportAriaLabel="Inventory diagram for snapshot snap-1"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("architecture-diagram-viewport")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Zoom out" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset to 100%" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fit in view" })).toBeInTheDocument();
    expect(screen.getByTestId("architecture-diagram-viewport-hint")).toHaveTextContent(/Zoom in and Zoom out/i);
    expect(screen.getByTestId("architecture-diagram-viewport-hint")).toHaveTextContent(/0 key/);
    expect(screen.queryByText(/^0$/)).not.toBeInTheDocument();
  });

  it("applies a custom zoom percentage from the input", async () => {
    replaceMock.mockClear();

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TB\n  a["A"]'}
        textAlternative="A"
        viewportAriaLabel="Inventory diagram for snapshot snap-1"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("architecture-diagram-zoom-input")).toBeInTheDocument();
    });

    const zoomInput = screen.getByLabelText("Diagram zoom percentage");

    fireEvent.change(zoomInput, { target: { value: "350" } });
    fireEvent.blur(zoomInput);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/governance/infrastructure/diagrams?diagZoom=3.50", {
        scroll: false,
      });
    });
  });

  it("clamps custom zoom percentages to the supported range", async () => {
    replaceMock.mockClear();

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TB\n  a["A"]'}
        textAlternative="A"
        viewportAriaLabel="Inventory diagram for snapshot snap-1"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("architecture-diagram-zoom-input")).toBeInTheDocument();
    });

    const zoomInput = screen.getByLabelText("Diagram zoom percentage");

    fireEvent.change(zoomInput, { target: { value: "1500" } });
    fireEvent.blur(zoomInput);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/governance/infrastructure/diagrams?diagZoom=10.00", {
        scroll: false,
      });
    });
  });

  it("keeps resource names when mermaid emits HTML labels inside foreignObject", async () => {
    mermaidRenderMock.mockResolvedValueOnce({
      svg: [
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80">',
        '<g class="node"><rect width="120" height="28" fill="#ececec"/>',
        '<foreignObject width="120" height="28"><div xmlns="http://www.w3.org/1999/xhtml">vnet-eastus</div></foreignObject>',
        "</g></svg>",
      ].join(""),
    });

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TB\n  a["vnet-eastus"]'}
        textAlternative="A"
        viewportAriaLabel="Inventory diagram for snapshot snap-1"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("architecture-diagram-viewport")).toHaveTextContent("vnet-eastus");
    });
  });
});
