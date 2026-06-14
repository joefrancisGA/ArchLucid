import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MermaidDiagram } from "@/components/help/MermaidDiagram";

const renderMock = vi.fn().mockResolvedValue({ svg: '<svg data-testid="rendered-mermaid"></svg>' });
const initializeMock = vi.fn();

vi.mock("mermaid", () => ({
  default: {
    initialize: initializeMock,
    render: renderMock,
  },
}));

describe("MermaidDiagram", () => {
  it("renders mermaid output instead of raw source by default", async () => {
    render(<MermaidDiagram source={"flowchart LR\n  A --> B"} />);

    expect(screen.getByText("Rendering diagram…")).toBeInTheDocument();
    expect(screen.queryByText("flowchart LR")).toBeNull();

    await waitFor(() => {
      expect(screen.getByTestId("rendered-mermaid")).toBeInTheDocument();
    });

    expect(initializeMock).toHaveBeenCalled();
    expect(renderMock).toHaveBeenCalledWith(expect.stringMatching(/^help-mermaid-/), "flowchart LR\n  A --> B");
  });

  it("keeps raw source behind a collapsed disclosure", async () => {
    render(<MermaidDiagram source={"flowchart LR\n  A --> B"} />);

    await waitFor(() => {
      expect(screen.getByTestId("rendered-mermaid")).toBeInTheDocument();
    });

    expect(screen.getByText("View diagram source")).toBeInTheDocument();
  });
});
