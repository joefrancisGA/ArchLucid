import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  GRAPH_CANVAS_CONTROLS_GROUP_LABEL,
  GRAPH_CANVAS_SELECTION_REQUIRED_TITLE,
  GraphBuyerCanvasToolbar,
} from "./GraphBuyerCanvasToolbar";
import {
  BUYER_EVIDENCE_GRAPH_FIT_GRAPH_CTA,
  BUYER_EVIDENCE_GRAPH_RESET_VIEW_CTA,
  BUYER_EVIDENCE_GRAPH_SHOW_SELECTED_PATH_CTA,
  BUYER_EVIDENCE_GRAPH_TRACE_PATH_CTA,
  BUYER_EVIDENCE_GRAPH_ZOOM_100_CTA,
} from "@/lib/buyer/buyer-polish-copy";

describe("GraphBuyerCanvasToolbar", () => {
  const noopHandlers = {
    onFitGraph: vi.fn(),
    onZoom100: vi.fn(),
    onResetView: vi.fn(),
    onTracePath: vi.fn(),
    onTogglePathOnly: vi.fn(),
  };

  it("exposes an accessibly named group for canvas controls", () => {
    render(
      <GraphBuyerCanvasToolbar {...noopHandlers} showPathOnly={false} hasSelection={false} />,
    );

    expect(screen.getByRole("group", { name: GRAPH_CANVAS_CONTROLS_GROUP_LABEL })).toBeInTheDocument();
  });

  it("disables Highlight path and Focus selection with a visible hint until a node is selected", () => {
    render(
      <GraphBuyerCanvasToolbar {...noopHandlers} showPathOnly={false} hasSelection={false} />,
    );

    const toolbar = screen.getByRole("group", { name: GRAPH_CANVAS_CONTROLS_GROUP_LABEL });
    const highlight = within(toolbar).getByRole("button", { name: BUYER_EVIDENCE_GRAPH_TRACE_PATH_CTA });
    const focus = within(toolbar).getByRole("button", {
      name: BUYER_EVIDENCE_GRAPH_SHOW_SELECTED_PATH_CTA,
    });

    expect(highlight).toBeDisabled();
    expect(focus).toBeDisabled();
    expect(highlight).toHaveAttribute("aria-describedby", "graph-buyer-canvas-selection-required-hint");
    expect(focus).toHaveAttribute("aria-describedby", "graph-buyer-canvas-selection-required-hint");
    expect(screen.getByTestId("graph-buyer-canvas-selection-required-hint")).toHaveTextContent(
      GRAPH_CANVAS_SELECTION_REQUIRED_TITLE,
    );

    expect(within(toolbar).getByRole("button", { name: BUYER_EVIDENCE_GRAPH_FIT_GRAPH_CTA })).toBeEnabled();
    expect(within(toolbar).getByRole("button", { name: BUYER_EVIDENCE_GRAPH_ZOOM_100_CTA })).toBeEnabled();
    expect(within(toolbar).getByRole("button", { name: BUYER_EVIDENCE_GRAPH_RESET_VIEW_CTA })).toBeEnabled();
  });

  it("enables Highlight path and Focus selection once a node is selected", () => {
    render(
      <GraphBuyerCanvasToolbar {...noopHandlers} showPathOnly={false} hasSelection={true} />,
    );

    const toolbar = screen.getByRole("group", { name: GRAPH_CANVAS_CONTROLS_GROUP_LABEL });
    const highlight = within(toolbar).getByRole("button", { name: BUYER_EVIDENCE_GRAPH_TRACE_PATH_CTA });
    const focus = within(toolbar).getByRole("button", {
      name: BUYER_EVIDENCE_GRAPH_SHOW_SELECTED_PATH_CTA,
    });

    expect(highlight).toBeEnabled();
    expect(focus).toBeEnabled();
    expect(highlight).not.toHaveAttribute("aria-describedby");
    expect(focus).not.toHaveAttribute("aria-describedby");
  });
});
