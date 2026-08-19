import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(async () => {
      throw new Error("Renderer failed");
    }),
  },
}));

import { ArchitectureDiagramViewer } from "@/components/architecture/ArchitectureDiagramViewer";

describe("ArchitectureDiagramViewer", () => {
  it("shows renderer failure and retry action", async () => {
    const onRetry = vi.fn();

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TB\n  a["A"]'}
        textAlternative="A"
        onRetry={onRetry}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("architecture-diagram-render-failure")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalled();
  });
});
